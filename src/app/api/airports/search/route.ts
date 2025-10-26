import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

// Deployment timestamp: 2025-10-26 18:00 UTC - Fix Duffel client initialization

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
    const duffel = new Duffel({
      token: process.env.DUFFEL_API_KEY,
    });

    // Search for airports using Duffel Places API
    console.log('Calling Duffel API for query:', query);
    const places = await duffel.suggestions.list({
      query: query,
    });

    console.log('Duffel API response:', {
      count: places.data.length,
      first: places.data[0]
    });

    // Filter to only show airports (not cities)
    const airports = places.data
      .filter((place: DuffelPlace) => place.type === 'airport')
      .map((place: DuffelPlace) => ({
        iataCode: place.iata_code || '',
        name: place.name || '',
        city: place.city_name || '',
        country: place.country_name || '',
        type: place.type || '',
      }))
      .slice(0, 10); // Limit to top 10 results

    console.log('Filtered airports:', airports.length);
    return NextResponse.json({ places: airports });
  } catch (error: any) {
    console.error('Airport search error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    // Log all error properties
    if (error) {
      console.error('Error keys:', Object.keys(error));
      console.error('Error details:', {
        message: error.message || 'No message',
        stack: error.stack || 'No stack',
        name: error.name || 'No name',
        code: error.code || 'No code',
        statusCode: error.statusCode || 'No statusCode',
        errors: error.errors || 'No errors',
      });
    }
    
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to search airports',
        details: error?.message || error?.toString() || 'Unknown error',
        errorType: error?.constructor?.name || typeof error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
