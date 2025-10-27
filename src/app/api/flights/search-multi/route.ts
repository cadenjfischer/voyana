import { NextRequest, NextResponse } from 'next/server';
import * as duffelClient from '@/lib/api/duffelClient';
import * as amadeusClient from '@/lib/api/amadeusClient';
import { mergeFlights, groupOffersByRoute } from '@/lib/utils/mergeFlights';

// Mark this route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract passenger info (same for all legs)
    const adults = parseInt(searchParams.get('adults') || '1');
    const children = parseInt(searchParams.get('children') || '0');
    const infantsLap = parseInt(searchParams.get('infantsLap') || '0');
    const infantsSeat = parseInt(searchParams.get('infantsSeat') || '0');
    const cabin = searchParams.get('cabin') || 'ECONOMY';
    
    // Extract flight segments
    const segments: Array<{ origin: string; destination: string; date: string }> = [];
    let segmentIndex = 1;
    
    while (searchParams.get(`origin${segmentIndex}`)) {
      const origin = searchParams.get(`origin${segmentIndex}`);
      const destination = searchParams.get(`destination${segmentIndex}`);
      const date = searchParams.get(`date${segmentIndex}`);
      
      if (origin && destination && date) {
        segments.push({ origin, destination, date });
      }
      segmentIndex++;
    }
    
    // Validate we have at least 2 segments
    if (segments.length < 2) {
      return NextResponse.json(
        { error: 'Multi-city search requires at least 2 flight segments' },
        { status: 400 }
      );
    }
    
    console.log(`Multi-city search: ${segments.length} segments`);
    segments.forEach((seg, i) => {
      console.log(`  Segment ${i + 1}: ${seg.origin} → ${seg.destination} on ${seg.date}`);
    });
    
    // Search each leg separately and combine results
    const legResults = await Promise.all(
      segments.map(async (segment, index) => {
        console.log(`Searching leg ${index + 1}: ${segment.origin} → ${segment.destination}`);
        
        const totalPassengers = adults + children + infantsLap + infantsSeat;
        
        // Search both APIs in parallel for this leg
        const [duffelResults, amadeusResults] = await Promise.allSettled([
          duffelClient.searchFlights({
            origin: segment.origin,
            destination: segment.destination,
            departureDate: segment.date,
            passengers: totalPassengers,
          }),
          amadeusClient.searchFlights({
            origin: segment.origin,
            destination: segment.destination,
            departureDate: segment.date,
            passengers: totalPassengers,
          }),
        ]);
        
        const duffelFlights = duffelResults.status === 'fulfilled' ? duffelResults.value : [];
        const amadeusFlights = amadeusResults.status === 'fulfilled' ? amadeusResults.value : [];
        
        console.log(`  Leg ${index + 1} results: Duffel=${duffelFlights.length}, Amadeus=${amadeusFlights.length}`);
        
        // Merge results for this leg
        const mergedFlights = mergeFlights([duffelFlights, amadeusFlights]);
        
        // Group by route for this leg
        const groupedOffers = groupOffersByRoute(mergedFlights);
        
        // Return display flights for this leg
        return Array.from(groupedOffers.values()).map(offers => ({
          ...offers[0], // Cheapest option
          fareOptions: offers,
        }));
      })
    );
    
    // Calculate total counts
    const totalFlightsPerLeg = legResults.map(leg => leg.length);
    const totalCombinations = totalFlightsPerLeg.reduce((a, b) => a * b, 1);
    
    console.log(`Multi-city results: ${totalFlightsPerLeg.join(' × ')} = ${totalCombinations} possible combinations`);
    
    return NextResponse.json({
      success: true,
      multiCity: true,
      segments: segments.map((seg, i) => ({
        ...seg,
        flightCount: legResults[i].length,
      })),
      legs: legResults,
      totalCombinations,
      passengerCount: adults + children + infantsLap + infantsSeat,
      cabinClass: cabin,
    });
  } catch (error) {
    console.error('Multi-city flight search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search multi-city flights',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
