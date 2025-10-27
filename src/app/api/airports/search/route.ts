import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

// Deployment timestamp: 2025-10-26 18:20 UTC - Enhanced error logging

interface DuffelPlace {
  iata_code?: string;
  name?: string;
  city_name?: string | null;
  country_name?: string | null;
  type?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    console.log('Airport search request:', { query });
    console.log('Duffel API Key exists:', !!process.env.DUFFEL_API_KEY);
    console.log('Duffel API Key length:', process.env.DUFFEL_API_KEY?.length);

    // Validate API key exists
    if (!process.env.DUFFEL_API_KEY) {
      console.error('DUFFEL_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ places: [] });
    }

    // Initialize Duffel client with the API key
    console.log('Initializing Duffel client...');
    let duffel;
    try {
      duffel = new Duffel({
        token: process.env.DUFFEL_API_KEY,
      });
      console.log('Duffel client initialized successfully');
    } catch (initError) {
      console.error('Failed to initialize Duffel client:', initError);
      return NextResponse.json(
        { error: 'Failed to initialize flight search client' },
        { status: 500 }
      );
    }

    // Search for airports using Duffel Places API
    console.log('Calling Duffel API for query:', query);
    let places;
    try {
      places = await duffel.suggestions.list({
        query: query,
      });
      console.log('Duffel API call successful, got response');
    } catch (apiError) {
      console.error('Duffel API call failed:', apiError);
      const apiErrorObj = apiError && typeof apiError === 'object' ? apiError as Record<string, unknown> : {};
      console.error('API Error details:', {
        message: apiErrorObj.message || 'No message',
        statusCode: apiErrorObj.statusCode || apiErrorObj.status,
        code: apiErrorObj.code,
        type: apiErrorObj.type,
      });
      throw apiError; // Re-throw to be caught by outer catch
    }

    console.log('Duffel API response:', {
      count: places.data.length,
      first: places.data[0],
      types: [...new Set(places.data.map((p: DuffelPlace) => p.type))]
    });

    // Filter for commercial airports only - exclude military bases, small regional airports
    // Duffel's suggestions.list already returns primarily commercial airports
    // Prioritize cities (they aggregate major airports), then commercial airports
    const filteredPlaces = places.data
      .filter((place: DuffelPlace) => {
        // Always include cities (they aggregate major airports)
        if (place.type === 'city') return true;
        
        // For airports, be very selective - only major commercial airports
        if (place.type === 'airport') {
          const name = (place.name || '').toLowerCase();
          
          // Exclude non-commercial facilities
          const nonCommercialKeywords = [
            'air force base',
            'air base',
            'afb',
            'military',
            'naval',
            'army',
            'marine corps',
            'heliport',
            'seaplane',
            'private',
          ];
          
          const isNonCommercial = nonCommercialKeywords.some(keyword => 
            name.includes(keyword)
          );
          
          if (isNonCommercial) return false;
          
          // Exclude small regional airports, county airports, municipal airports
          const smallAirportKeywords = [
            'regional',
            'county',
            'municipal',
            'field', // Like "Cox Field"
            'executive',
            'airpark',
          ];
          
          const isSmallAirport = smallAirportKeywords.some(keyword => 
            name.includes(keyword)
          );
          
          if (isSmallAirport) return false;
          
          // Only include airports that explicitly say "Airport" or "International"
          // This filters out smaller facilities
          const isMajorAirport = name.includes('airport') || name.includes('international');
          
          return isMajorAirport;
        }
        
        return false;
      });
    
    // Sort to prioritize cities first (better UX for major metros)
    const sortedPlaces = filteredPlaces.sort((a: DuffelPlace, b: DuffelPlace) => {
      if (a.type === 'city' && b.type !== 'city') return -1;
      if (a.type !== 'city' && b.type === 'city') return 1;
      return 0;
    });
    
    const airports = sortedPlaces
      .map((place: DuffelPlace) => ({
        iataCode: place.iata_code || '',
        name: place.name || '',
        city: place.city_name || place.name || '', // Use name if city_name is null
        country: place.country_name || '',
        type: place.type || '',
      }))
      .slice(0, 15); // Increased limit since we're filtering out more

    console.log('Filtered airports:', airports.length);
    return NextResponse.json({ places: airports });
  } catch (error: unknown) {
    console.error('Airport search error:', error);
    console.error('Error type:', typeof error);
    console.error('Error stringified:', JSON.stringify(error, null, 2));
    
    // Type guard to safely access error properties
    const isErrorObject = error && typeof error === 'object';
    const errorObj = isErrorObject ? error as Record<string, unknown> : {};
    
    console.error('Error constructor:', errorObj.constructor?.name);
    console.error('Error as string:', String(error));
    
    // Log all error properties
    if (isErrorObject) {
      console.error('Error keys:', Object.keys(error));
      console.error('Error details:', {
        message: errorObj.message || 'No message',
        stack: errorObj.stack || 'No stack',
        name: errorObj.name || 'No name',
        code: errorObj.code || 'No code',
        statusCode: errorObj.statusCode || 'No statusCode',
        errors: errorObj.errors || 'No errors',
        response: errorObj.response || 'No response',
        data: errorObj.data || 'No data',
      });
    }
    
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error 
      ? error.message 
      : isErrorObject && errorObj.message
      ? String(errorObj.message)
      : String(error);
      
    return NextResponse.json(
      { 
        error: 'Failed to search airports',
        details: errorMessage,
        errorType: errorObj.constructor?.name || typeof error,
        errorString: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
