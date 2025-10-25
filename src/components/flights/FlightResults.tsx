'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { Plane } from 'lucide-react';

interface FlightResultsProps {
  flights: NormalizedFlight[];
}

export default function FlightResults({ flights }: FlightResultsProps) {
  const [selectedFlight, setSelectedFlight] = useState<NormalizedFlight | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBook = async (flight: NormalizedFlight) => {
    setIsBooking(true);
    try {
      // Get user ID from local storage or auth context
      const userId = localStorage.getItem('userId') || 'demo-user';

      const response = await fetch('/api/flights/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flight,
          userId,
          passengers: [
            {
              type: 'adult',
              given_name: 'John',
              family_name: 'Doe',
              email: 'john.doe@example.com',
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingSuccess(true);
      setSelectedFlight(null);
      
      // Show success message for 3 seconds
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (error) {
      console.error('Booking error:', error);
      alert(error instanceof Error ? error.message : 'Failed to book flight');
    } finally {
      setIsBooking(false);
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
      {/* Success Message */}
      {bookingSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
          <p className="font-medium">Flight booked successfully!</p>
        </div>
      )}

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
                onClick={() => handleBook(flight)}
                disabled={isBooking}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBooking ? 'Booking...' : 'Book Now'}
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
    </div>
  );
}
