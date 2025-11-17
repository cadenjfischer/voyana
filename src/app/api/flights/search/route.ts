import { NextRequest, NextResponse } from 'next/server';
import * as duffelClient from '@/lib/api/duffelClient';
import { groupOffersByRoute } from '@/lib/utils/mergeFlights';

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
    
    // Handle new passenger breakdown structure
    const adults = parseInt(searchParams.get('adults') || '1');
    const children = parseInt(searchParams.get('children') || '0');
    const infantsLap = parseInt(searchParams.get('infantsLap') || '0');
    const infantsSeat = parseInt(searchParams.get('infantsSeat') || '0');
    const passengers = adults + children + infantsLap + infantsSeat;
    
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
    console.log(`Passengers: ${adults} adults, ${children} children, ${infantsLap} infants (lap), ${infantsSeat} infants (seat)`);

    // Search Duffel API - returns all cabin classes for fare options
    const duffelFlights = await duffelClient.searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infantsLap,
      infantsSeat,
      // No cabinClass - returns all cabin classes
    });

    console.log(`Duffel results: ${duffelFlights.length} offers`);
    
    // Log cabin class breakdown
    const duffelCabins = duffelFlights.reduce((acc: Record<string, number>, f) => {
      acc[f.cabinClass] = (acc[f.cabinClass] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Duffel cabin classes:', duffelCabins);

    // Group offers by route to identify different fare classes for same flight
    const groupedOffers = groupOffersByRoute(duffelFlights);
    
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

    console.log(`Results: ${duffelFlights.length} offers, ${displayFlights.length} unique flights`);

    return NextResponse.json({
      success: true,
      count: displayFlights.length,
      flights: displayFlights,
      totalOffers: duffelFlights.length,
      sources: {
        duffel: duffelFlights.length,
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
