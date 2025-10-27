import { NextRequest, NextResponse } from 'next/server';
import * as duffelClient from '@/lib/api/duffelClient';
import * as amadeusClient from '@/lib/api/amadeusClient';
import { mergeFlights, groupOffersByRoute } from '@/lib/utils/mergeFlights';

// Mark this route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// All environment variables configured

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const returnDate = searchParams.get('returnDate') || undefined;
    const passengers = parseInt(searchParams.get('passengers') || '1');
    // Don't use cabinClass parameter - we want ALL cabin classes for fare options
    // const cabinClass = searchParams.get('cabinClass') as any || 'economy';

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    console.log(`Searching flights: ${origin} → ${destination} on ${departureDate}`);

    // Search both APIs in parallel - WITHOUT cabin class filter to get all fare options
    const [duffelResults, amadeusResults] = await Promise.allSettled([
      duffelClient.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        // No cabinClass - returns all cabin classes
      }),
      amadeusClient.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        // No cabinClass - returns all cabin classes
      }),
    ]);

    // Extract successful results
    const duffelFlights = duffelResults.status === 'fulfilled' ? duffelResults.value : [];
    const amadeusFlights = amadeusResults.status === 'fulfilled' ? amadeusResults.value : [];

    console.log(`Duffel results: ${duffelFlights.length}, Amadeus results: ${amadeusFlights.length}`);
    
    // Log cabin class breakdown
    const duffelCabins = duffelFlights.reduce((acc: Record<string, number>, f) => {
      acc[f.cabinClass] = (acc[f.cabinClass] || 0) + 1;
      return acc;
    }, {});
    const amadeusCabins = amadeusFlights.reduce((acc: Record<string, number>, f) => {
      acc[f.cabinClass] = (acc[f.cabinClass] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Duffel cabin classes:', duffelCabins);
    console.log('Amadeus cabin classes:', amadeusCabins);
    console.log('Sample Amadeus flights:', amadeusFlights.slice(0, 3).map(f => ({
      id: f.id,
      carrier: f.carrier,
      flight: f.flightNumber,
      cabin: f.cabinClass,
      price: f.price,
      apiSource: f.apiSource
    })));

    // Merge all results (keeping all fare options)
    const mergedFlights = mergeFlights([duffelFlights, amadeusFlights]);
    
    console.log('Merged flights sample:', mergedFlights.slice(0, 3).map(f => ({
      id: f.id,
      carrier: f.carrier,
      flightNumber: f.flightNumber,
      price: f.price,
      cabinClass: f.cabinClass,
    })));

    // Group offers by route to identify different fare classes for same flight
    const groupedOffers = groupOffersByRoute(mergedFlights);
    
    console.log(`Grouped into ${groupedOffers.size} unique routes`);
    
    // For display: show one flight per route (cheapest option)
    // But include all offers data so modal can show fare options
    const displayFlights = Array.from(groupedOffers.values()).map(offers => {
      const cheapest = offers[0]; // Already sorted by price
      console.log(`Route ${cheapest.flightNumber}: ${offers.length} fare options`, 
        offers.map(o => ({ price: o.price, cabin: o.cabinClass })));
      
      const result = {
        ...cheapest,
        // Add all fare options for this route
        fareOptions: offers,
      };
      
      console.log(`Flight ${cheapest.flightNumber} fareOptions count:`, result.fareOptions?.length);
      return result;
    });

    console.log(`Merged results: ${mergedFlights.length} offers, ${displayFlights.length} unique flights`);

    return NextResponse.json({
      success: true,
      count: displayFlights.length,
      flights: displayFlights,
      totalOffers: mergedFlights.length,
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
