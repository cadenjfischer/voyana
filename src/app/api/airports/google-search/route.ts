import { NextRequest, NextResponse } from 'next/server';

interface GooglePlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface AirportDetails {
  code: string;
  name: string;
  city: string;
  country: string;
}

// Cache for recent queries to reduce API calls
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for place details (IATA codes)
const placeDetailsCache = new Map<string, { data: AirportDetails | null; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    console.log('Google Places airport search request:', { query });

    if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
      console.error('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Google API key' },
        { status: 500 }
      );
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ places: [] });
    }

    // Check cache first
    const cacheKey = query.toLowerCase();
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached results for:', query);
      return NextResponse.json({ places: cached.data });
    }

    // Call Google Places Text Search API for location-based searches
    // This finds "airports in [location]" not just airports with location in the name
    const textSearchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    textSearchUrl.searchParams.set('query', `airports in ${query}`);
    textSearchUrl.searchParams.set('type', 'airport');
    textSearchUrl.searchParams.set('key', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);

    console.log('Calling Google Places Text Search API...');
    const textSearchResponse = await fetch(textSearchUrl.toString());
    const textSearchData = await textSearchResponse.json();

    if (textSearchData.status !== 'OK' && textSearchData.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', textSearchData);
      return NextResponse.json(
        { error: `Google Places API error: ${textSearchData.status}` },
        { status: 500 }
      );
    }

    console.log('Google Places response:', {
      status: textSearchData.status,
      count: textSearchData.results?.length || 0,
      first: textSearchData.results?.[0]
    });

    if (!textSearchData.results || textSearchData.results.length === 0) {
      return NextResponse.json({ places: [] });
    }

    // Process results to extract IATA codes
    const airports = textSearchData.results.slice(0, 10).map((result: any) => {
      // Extract IATA code from name (e.g., "Burlington International Airport (BTV)")
      const iataMatch = result.name.match(/\(([A-Z]{3})\)/);
      const iataCode = iataMatch ? iataMatch[1] : '';
      
      // Extract name without IATA code
      const name = result.name.replace(/\s*\([A-Z]{3}\)/, '');
      
      // Get city and country from formatted_address
      const addressParts = result.formatted_address?.split(',').map((p: string) => p.trim()) || [];
      const city = extractCityFromAddress(addressParts);
      const country = addressParts[addressParts.length - 1] || '';
      
      return {
        iataCode,
        name,
        city,
        country,
        type: 'airport',
        placeId: result.place_id,
      };
    });

    // Filter out airports without IATA codes and limit to 5
    const validAirports = airports
      .filter((airport: any) => airport.iataCode)
      .slice(0, 5);

    console.log('Processed airports:', validAirports.length);
    console.log('First airport:', validAirports[0]);

    // Cache the results
    queryCache.set(cacheKey, { data: validAirports, timestamp: Date.now() });

    return NextResponse.json({ places: validAirports });
  } catch (error: unknown) {
    console.error('Airport search error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search airports',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

function extractCityFromAddress(addressParts: string[]): string {
  // Address format examples:
  // ["Airport Dr", "South Burlington", "VT 05403", "USA"]
  // ["Orly", "94390", "France"]
  // Find the part that looks like a city (not a postal code, not a country)
  
  if (addressParts.length >= 3) {
    // Usually city is second or third part
    for (let i = 1; i < addressParts.length - 1; i++) {
      const part = addressParts[i];
      // Skip if it looks like a postal code (contains numbers) or state code (2 letters)
      if (!/\d/.test(part) && part.length > 2) {
        return part;
      }
    }
  }
  
  return addressParts[0] || '';
}

async function getAirportDetails(placeId: string): Promise<AirportDetails | null> {
  // Check cache first
  const cached = placeDetailsCache.get(placeId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('fields', 'name,address_components,formatted_address');
    detailsUrl.searchParams.set('key', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!);

    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      placeDetailsCache.set(placeId, { data: null, timestamp: Date.now() });
      return null;
    }

    // Extract IATA code from name (usually in parentheses like "Burlington International Airport (BTV)")
    const iataMatch = data.result.name.match(/\(([A-Z]{3})\)/);
    const iataCode = iataMatch ? iataMatch[1] : '';

    // Extract city and country from address components
    let city = '';
    let country = '';
    
    if (data.result.address_components) {
      for (const component of data.result.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      }
    }

    const details: AirportDetails = {
      code: iataCode,
      name: data.result.name.replace(/\s*\([A-Z]{3}\)/, ''), // Remove IATA code from name
      city,
      country,
    };

    // Cache the details
    placeDetailsCache.set(placeId, { data: details, timestamp: Date.now() });

    return details;
  } catch (error) {
    console.error('Error fetching place details:', error);
    placeDetailsCache.set(placeId, { data: null, timestamp: Date.now() });
    return null;
  }
}

function extractCity(secondaryText: string): string {
  // Secondary text format examples:
  // "Airport Drive, South Burlington, VT, USA" -> want "South Burlington"
  // "Orly, France" -> want "Orly"
  // "Romeo Vachon Boulevard North, Dorval, QC, Canada" -> want "Dorval"
  
  const parts = secondaryText.split(',').map(p => p.trim());
  
  // If we have at least 3 parts, the city is usually the second-to-last or in the middle
  if (parts.length >= 3) {
    // Check if second-to-last looks like a state code (2 letters)
    const secondToLast = parts[parts.length - 2];
    if (secondToLast && secondToLast.length === 2 && secondToLast.match(/^[A-Z]{2}$/)) {
      // Format: "Street, City, ST, Country" -> return City (third from end)
      return parts[parts.length - 3] || parts[0];
    }
  }
  
  // For formats like "City, Country", return first part
  if (parts.length === 2) {
    return parts[0];
  }
  
  // Default: return first non-street part (usually second part)
  return parts[1] || parts[0] || '';
}

function extractCountry(secondaryText: string): string {
  // Get the last part which is usually the country
  const parts = secondaryText.split(',').map(p => p.trim());
  return parts[parts.length - 1] || '';
}
