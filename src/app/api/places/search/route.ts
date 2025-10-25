import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [], status: 'INVALID_REQUEST' });
  }

  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not found');
    return NextResponse.json({ 
      error: 'API key not configured',
      results: [],
      status: 'REQUEST_DENIED' 
    }, { status: 500 });
  }

  try {
    // Include 'address' type to allow street addresses, not just cities/towns
    const types = ['address', 'country', 'region', 'place', 'locality', 'neighborhood', 'poi'].join(',');
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json`);
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    url.searchParams.set('autocomplete', 'true');
    url.searchParams.set('limit', '8');
    url.searchParams.set('language', 'en');
    url.searchParams.set('types', types);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Mapbox Geocoding error: ${response.status}`);
    }

    const data = await response.json();

    // Map Mapbox features to GooglePlace-like shape for UI compatibility
    const results = (data.features || []).map((f: { center?: number[]; text?: string; place_name?: string; id?: string; place_type?: string[] }) => {
      const [lng, lat] = f.center || [0, 0];
      const name = f.text || f.place_name || '';
      const formatted = f.place_name || name;
      const placeId = f.id || `${lng},${lat}`;
      const typesFromMapbox = (f.place_type || []).map((t: string) => {
        switch (t) {
          case 'country': return 'country';
          case 'region': return 'administrative_area_level_1';
          case 'place': return 'locality';
          case 'locality': return 'sublocality';
          case 'neighborhood': return 'neighborhood';
          case 'poi': return 'point_of_interest';
          default: return 'establishment';
        }
      });

      return {
        place_id: placeId,
        name,
        formatted_address: formatted,
        geometry: { location: { lat, lng } },
        types: typesFromMapbox
      };
    });

    return NextResponse.json({ results, status: 'OK' });
  } catch (error) {
    console.error('Mapbox Geocoding error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      results: [],
      status: 'UNKNOWN_ERROR' 
    }, { status: 500 });
  }
}
