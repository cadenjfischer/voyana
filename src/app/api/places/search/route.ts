import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [], status: 'INVALID_REQUEST' });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key not found');
    return NextResponse.json({ 
      error: 'API key not configured',
      results: [],
      status: 'REQUEST_DENIED' 
    }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      key: GOOGLE_PLACES_API_KEY,
      language: 'en'
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for relevant place types
    const relevantTypes = [
      'locality', 
      'administrative_area_level_1', 
      'country', 
      'tourist_attraction',
      'establishment',
      'point_of_interest',
      'natural_feature',
      'colloquial_area',
      'sublocality',
      'neighborhood'
    ];

    // Be more permissive - include all results first, then filter out obvious non-destinations
    const excludedTypes = ['route', 'street_number', 'premise'];
    const filteredResults = data.results
      ?.filter((place: { types?: string[] }) => 
        !place.types?.some((type: string) => excludedTypes.includes(type))
      )
      .slice(0, 8) || [];

    return NextResponse.json({
      results: filteredResults,
      status: data.status || 'OK'
    });

  } catch (error) {
    console.error('Google Places API error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      results: [],
      status: 'UNKNOWN_ERROR' 
    }, { status: 500 });
  }
}
