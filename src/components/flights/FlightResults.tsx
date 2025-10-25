'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { Plane } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import PassengerInfoModal, { PassengerInfo } from './PassengerInfoModal';

interface FlightResultsProps {
  flights: NormalizedFlight[];
  onFlightBooked?: () => void;
  passengerCount?: number;
}

export default function FlightResults({ 
  flights, 
  onFlightBooked,
  passengerCount = 1 
}: FlightResultsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  const [bookingFlight, setBookingFlight] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<NormalizedFlight | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBookClick = (flight: NormalizedFlight) => {
    if (!user) {
      alert('Please sign in to book flights');
      return;
    }
    setSelectedFlight(flight);
    setModalOpen(true);
  };

  const handleConfirmBooking = async (passengers: PassengerInfo[]) => {
    if (!selectedFlight || !user) return;

    setModalOpen(false);
    setBookingFlight(selectedFlight.id);

    try {
      // Transform passengers to the format expected by the APIs
      const formattedPassengers = passengers.map(p => ({
        type: 'adult',
        title: p.title,
        given_name: p.givenName,
        family_name: p.familyName,
        born_on: p.dateOfBirth,
        email: p.email,
        phone_number: p.phoneNumber,
        gender: p.gender,
      }));

      const response = await fetch('/api/flights/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight: selectedFlight,
          userId: user.id,
          passengers: formattedPassengers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Flight booked successfully! Reference: ${data.bookingReference}`);
        onFlightBooked?.();
      } else {
        alert(`Booking failed: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book flight. Please try again.');
    } finally {
      setBookingFlight(null);
      setSelectedFlight(null);
    }
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(\d+)?M?/);
    if (!match) return duration;
    const hours = match[1];
    const minutes = match[2] || '00';
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Flight Cards */}
      {flights.map((flight) => (
        <div
          key={flight.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            {/* Flight Info */}
            <div className="flex-1 space-y-4">
              {/* Airline Logo and Name */}
              <div className="flex items-center gap-3">
                {flight.carrierLogo ? (
                  <img
                    src={flight.carrierLogo}
                    alt={flight.carrier}
                    className="h-8 w-auto"
                  />
                ) : (
                  <Plane className="h-8 w-8 text-blue-600" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{flight.carrier}</p>
                  <p className="text-sm text-gray-500">{flight.flightNumber}</p>
                </div>
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {flight.cabinClass}
                </span>
              </div>

              {/* Route and Times */}
              <div className="flex items-center gap-8">
                {/* Departure */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {format(new Date(flight.departure), 'HH:mm')}
                  </p>
                  <p className="text-sm font-medium text-gray-700">{flight.origin}</p>
                  <p className="text-xs text-gray-500">{flight.originName}</p>
                </div>

                {/* Duration and Stops */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-1">{formatDuration(flight.duration)}</p>
                  <div className="w-full h-px bg-gray-300 relative">
                    <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 bg-white" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {format(new Date(flight.arrival), 'HH:mm')}
                  </p>
                  <p className="text-sm font-medium text-gray-700">{flight.destination}</p>
                  <p className="text-xs text-gray-500">{flight.destinationName}</p>
                </div>
              </div>

              {/* Source Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Source:</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  flight.apiSource === 'duffel' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {flight.apiSource === 'duffel' ? 'Duffel' : 'Amadeus'}
                </span>
              </div>
            </div>

            {/* Price and Book Button */}
            <div className="ml-8 flex flex-col items-end">
              <div className="text-right mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  {flight.currency === 'USD' ? '$' : flight.currency}
                  {flight.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">per person</p>
              </div>

              <button
                onClick={() => handleBookClick(flight)}
                disabled={bookingFlight === flight.id}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bookingFlight === flight.id ? 'Booking...' : 'Book Now'}
              </button>

              <button
                onClick={() => setSelectedFlight(selectedFlight?.id === flight.id ? null : flight)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedFlight?.id === flight.id ? 'Hide Details' : 'View Details'}
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          {selectedFlight?.id === flight.id && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Departure Date</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(flight.departure), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Arrival Date</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(flight.arrival), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Flight Duration</p>
                  <p className="font-medium text-gray-900">{formatDuration(flight.duration)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cabin Class</p>
                  <p className="font-medium text-gray-900">{flight.cabinClass}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Passenger Information Modal */}
      {selectedFlight && (
        <PassengerInfoModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedFlight(null);
          }}
          flight={selectedFlight}
          passengerCount={passengerCount}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}
