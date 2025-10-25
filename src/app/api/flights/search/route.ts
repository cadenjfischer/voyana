import { NextRequest, NextResponse } from 'next/server';
import * as duffelClient from '@/lib/api/duffelClient';
import * as amadeusClient from '@/lib/api/amadeusClient';
import { mergeFlights } from '@/lib/utils/mergeFlights';

// Mark this route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const returnDate = searchParams.get('returnDate') || undefined;
    const passengers = parseInt(searchParams.get('passengers') || '1');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cabinClass = searchParams.get('cabinClass') as any || 'economy';

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    console.log(`Searching flights: ${origin} → ${destination} on ${departureDate}`);

    // Search both APIs in parallel
    const [duffelResults, amadeusResults] = await Promise.allSettled([
      duffelClient.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass,
      }),
      amadeusClient.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass: cabinClass.toUpperCase(),
      }),
    ]);

    // Extract successful results
    const duffelFlights = duffelResults.status === 'fulfilled' ? duffelResults.value : [];
    const amadeusFlights = amadeusResults.status === 'fulfilled' ? amadeusResults.value : [];

    console.log(`Duffel results: ${duffelFlights.length}, Amadeus results: ${amadeusFlights.length}`);

    // Merge and deduplicate results
    const mergedFlights = mergeFlights([duffelFlights, amadeusFlights]);

    console.log(`Merged results: ${mergedFlights.length} flights`);

    return NextResponse.json({
      success: true,
      count: mergedFlights.length,
      flights: mergedFlights,
      sources: {
        duffel: duffelFlights.length,
        amadeus: amadeusFlights.length,
      },
    });
  } catch (error) {
    console.error('Flight search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search flights',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
