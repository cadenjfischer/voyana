'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FlightBooking } from '@/lib/services/itineraryService';
import { Plane, Calendar, Clock, MapPin } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // Get user ID from local storage or auth context
      const userId = localStorage.getItem('userId') || 'demo-user';

      const response = await fetch(`/api/flights/bookings?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Fetch bookings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(\d+)?M?/);
    if (!match) return duration;
    const hours = match[1];
    const minutes = match[2] || '00';
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start searching for flights to make your first booking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Flight Bookings</h2>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Booking Info */}
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Plane className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{booking.carrier}</p>
                    <p className="text-sm text-gray-500">{booking.flightNumber}</p>
                  </div>
                  {booking.bookingReference && (
                    <span className="ml-4 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                      Confirmed
                    </span>
                  )}
                </div>

                {/* Route */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">From</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{booking.origin}</p>
                    <p className="text-sm text-gray-500">{booking.originName}</p>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-px w-full bg-gray-300 relative">
                      <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 bg-white" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">To</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{booking.destination}</p>
                    <p className="text-sm text-gray-500">{booking.destinationName}</p>
                  </div>
                </div>

                {/* Flight Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Departure</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(booking.departureTime), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(booking.departureTime), 'HH:mm')}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Arrival</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(booking.arrivalTime), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(booking.arrivalTime), 'HH:mm')}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Duration</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration(booking.duration)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cabin</p>
                    <p className="text-sm font-medium text-gray-900">{booking.cabinClass}</p>
                  </div>
                </div>

                {/* Booking Reference */}
                {booking.bookingReference && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Booking Reference</p>
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {booking.bookingReference}
                    </p>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="ml-8 text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {booking.currency === 'USD' ? '$' : booking.currency}
                  {booking.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Total paid</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
