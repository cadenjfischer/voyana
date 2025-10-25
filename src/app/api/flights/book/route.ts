import { NextRequest, NextResponse } from 'next/server';
import * as duffelClient from '@/lib/api/duffelClient';
import * as amadeusClient from '@/lib/api/amadeusClient';
import { saveFlightBooking } from '@/lib/services/itineraryService';

// Mark this route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flight, passengers, userId } = body;

    // Validate required fields
    if (!flight || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: flight, userId' },
        { status: 400 }
      );
    }

    console.log(`Booking flight ${flight.flightNumber} for user ${userId}`);

    // Determine which API to use based on the flight source
    let bookingResult;
    
    if (flight.apiSource === 'duffel') {
      bookingResult = await duffelClient.bookFlight(flight.id, passengers);
    } else if (flight.apiSource === 'amadeus') {
      bookingResult = await amadeusClient.bookFlight(flight.rawData, passengers);
    } else {
      return NextResponse.json(
        { error: 'Invalid flight source' },
        { status: 400 }
      );
    }

    // Check if booking was successful
    if (!bookingResult.success) {
      return NextResponse.json(
        { 
          error: 'Booking failed',
          message: bookingResult.error
        },
        { status: 400 }
      );
    }

    // Save booking to Supabase
    const savedBooking = await saveFlightBooking({
      userId,
      carrier: flight.carrier,
      flightNumber: flight.flightNumber,
      origin: flight.origin,
      originName: flight.originName,
      destination: flight.destination,
      destinationName: flight.destinationName,
      departureTime: flight.departure,
      arrivalTime: flight.arrival,
      price: flight.price,
      currency: flight.currency,
      cabinClass: flight.cabinClass,
      stops: flight.stops,
      duration: flight.duration,
      source: flight.apiSource,
      bookingReference: bookingResult.bookingReference,
      rawData: bookingResult.order,
    });

    return NextResponse.json({
      success: true,
      booking: savedBooking,
      bookingReference: bookingResult.bookingReference,
    });
  } catch (error) {
    console.error('Flight booking error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to book flight',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
