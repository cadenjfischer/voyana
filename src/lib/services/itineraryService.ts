import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface FlightBooking {
  id?: string;
  userId: string;
  carrier: string;
  flightNumber: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  cabinClass: string;
  stops: number;
  duration: string;
  source: 'duffel' | 'amadeus';
  bookingReference?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData?: any;
  createdAt?: string;
}

/**
 * Save a flight booking to Supabase
 */
export async function saveFlightBooking(booking: FlightBooking): Promise<FlightBooking> {
  const { data, error } = await supabase
    .from('flight_bookings')
    .insert([
      {
        user_id: booking.userId,
        carrier: booking.carrier,
        flight_number: booking.flightNumber,
        origin: booking.origin,
        origin_name: booking.originName,
        destination: booking.destination,
        destination_name: booking.destinationName,
        departure_time: booking.departureTime,
        arrival_time: booking.arrivalTime,
        price: booking.price,
        currency: booking.currency,
        cabin_class: booking.cabinClass,
        stops: booking.stops,
        duration: booking.duration,
        source: booking.source,
        booking_reference: booking.bookingReference,
        raw_data: booking.rawData,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving flight booking:', error);
    throw new Error(`Failed to save booking: ${error.message}`);
  }

  return {
    id: data.id,
    userId: data.user_id,
    carrier: data.carrier,
    flightNumber: data.flight_number,
    origin: data.origin,
    originName: data.origin_name,
    destination: data.destination,
    destinationName: data.destination_name,
    departureTime: data.departure_time,
    arrivalTime: data.arrival_time,
    price: data.price,
    currency: data.currency,
    cabinClass: data.cabin_class,
    stops: data.stops,
    duration: data.duration,
    source: data.source,
    bookingReference: data.booking_reference,
    rawData: data.raw_data,
    createdAt: data.created_at,
  };
}

/**
 * Get all flight bookings for a user
 */
export async function getFlightBookings(userId: string): Promise<FlightBooking[]> {
  const { data, error } = await supabase
    .from('flight_bookings')
    .select('*')
    .eq('user_id', userId)
    .order('departure_time', { ascending: true });

  if (error) {
    console.error('Error fetching flight bookings:', error);
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    carrier: row.carrier,
    flightNumber: row.flight_number,
    origin: row.origin,
    originName: row.origin_name,
    destination: row.destination,
    destinationName: row.destination_name,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    price: row.price,
    currency: row.currency,
    cabinClass: row.cabin_class,
    stops: row.stops,
    duration: row.duration,
    source: row.source,
    bookingReference: row.booking_reference,
    rawData: row.raw_data,
    createdAt: row.created_at,
  }));
}

/**
 * Get a single flight booking by ID
 */
export async function getFlightBooking(bookingId: string): Promise<FlightBooking | null> {
  const { data, error } = await supabase
    .from('flight_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching flight booking:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    carrier: data.carrier,
    flightNumber: data.flight_number,
    origin: data.origin,
    originName: data.origin_name,
    destination: data.destination,
    destinationName: data.destination_name,
    departureTime: data.departure_time,
    arrivalTime: data.arrival_time,
    price: data.price,
    currency: data.currency,
    cabinClass: data.cabin_class,
    stops: data.stops,
    duration: data.duration,
    source: data.source,
    bookingReference: data.booking_reference,
    rawData: data.raw_data,
    createdAt: data.created_at,
  };
}

/**
 * Delete a flight booking
 */
export async function deleteFlightBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('flight_bookings')
    .delete()
    .eq('id', bookingId);

  if (error) {
    console.error('Error deleting flight booking:', error);
    throw new Error(`Failed to delete booking: ${error.message}`);
  }
}
