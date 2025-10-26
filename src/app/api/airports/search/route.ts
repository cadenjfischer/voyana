import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

const duffel = new Duffel({
  token: process.env.DUFFEL_API_KEY!,
});

// Log to verify env var is loaded (will show in Vercel logs)
console.log('Duffel API Key exists:', !!process.env.DUFFEL_API_KEY);
// Deployment timestamp: 2025-10-26

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
    console.log('Duffel API Key prefix:', process.env.DUFFEL_API_KEY?.substring(0, 15));

    if (!query || query.length < 2) {
      return NextResponse.json({ places: [] });
    }

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
  } catch (error) {
    console.error('Airport search error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to search airports',
        details: error instanceof Error ? error.message : 'Unknown error',
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      },
      { status: 500 }
    );
  }
}
