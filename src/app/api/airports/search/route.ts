import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

const duffel = new Duffel({
  token: process.env.DUFFEL_API_KEY!,
});

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

    if (!query || query.length < 2) {
      return NextResponse.json({ places: [] });
    }

    // Search for airports using Duffel Places API
    const places = await duffel.suggestions.list({
      query: query,
    });

    // Filter to only show airports (not cities)
    const airports = places.data
      .filter((place: any) => place.type === 'airport')
      .map((place: any) => ({
        iataCode: place.iata_code || '',
        name: place.name || '',
        city: place.city_name || '',
        country: place.country_name || '',
        type: place.type || '',
      }))
      .slice(0, 10); // Limit to top 10 results

    return NextResponse.json({ places: airports });
  } catch (error) {
    console.error('Airport search error:', error);
    return NextResponse.json(
      { error: 'Failed to search airports' },
      { status: 500 }
    );
  }
}
