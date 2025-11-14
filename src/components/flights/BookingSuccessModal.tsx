'use client';

import { Check } from 'lucide-react';
import { NormalizedFlight } from '@/lib/api/duffelClient';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingReference: string;
  flight: NormalizedFlight;
}

export default function BookingSuccessModal({
  isOpen,
  onClose,
  bookingReference,
  flight,
}: BookingSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-static-bg-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-static-text-900 dark:text-static-text-100 mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-static-text-600 dark:text-static-text-400 mb-8">
          Your flight has been successfully booked
        </p>

        {/* Booking Details */}
        <div className="bg-static-bg-50 dark:bg-static-bg-900 rounded-xl p-6 mb-8 text-left">
          <div className="mb-4">
            <p className="text-xs text-static-text-500 dark:text-static-text-400 uppercase mb-1">
              Booking Reference
            </p>
            <p className="text-2xl font-bold text-static-accent-600 dark:text-static-accent-400 font-mono tracking-wider">
              {bookingReference}
            </p>
          </div>

          <div className="border-t border-static-bg-200 dark:border-static-bg-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-static-text-600 dark:text-static-text-400">
                Route
              </span>
              <span className="text-sm font-semibold text-static-text-900 dark:text-static-text-100">
                {flight.origin} → {flight.destination}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-static-text-600 dark:text-static-text-400">
                Flight
              </span>
              <span className="text-sm font-semibold text-static-text-900 dark:text-static-text-100">
                {flight.carrier} {flight.flightNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-static-text-600 dark:text-static-text-400">
                Departure
              </span>
              <span className="text-sm font-semibold text-static-text-900 dark:text-static-text-100">
                {new Date(flight.departure).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <p className="text-sm text-static-text-600 dark:text-static-text-400 mb-6">
          A confirmation email has been sent with your booking details and e-ticket.
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-static-accent-600 dark:bg-static-accent-500 text-white font-semibold rounded-lg hover:bg-static-accent-700 dark:hover:bg-static-accent-600 transition-colors shadow-lg"
        >
          View My Bookings
        </button>
      </div>
    </div>
  );
}
