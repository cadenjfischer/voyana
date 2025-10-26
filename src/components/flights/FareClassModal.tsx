'use client';

import { X, Check, Wifi, Zap, Monitor, Utensils, Luggage } from 'lucide-react';
import { NormalizedFlight } from '@/lib/api/duffelClient';

interface FareClass {
  name: string;
  cabin: string;
  price: number;
  currency: string;
  features: {
    seatSelection: 'free' | 'fee' | 'included';
    carryOn: number;
    checked: number;
    changes: 'not-allowed' | 'fee' | 'included';
    refund: boolean;
    wifi?: boolean;
    meals?: boolean;
    priority?: boolean;
  };
}

interface FareClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: NormalizedFlight;
  onSelectFare: (fareClass: FareClass) => void;
}

export default function FareClassModal({
  isOpen,
  onClose,
  flight,
  onSelectFare,
}: FareClassModalProps) {
  if (!isOpen) return null;

  // Generate fare classes based on the flight's base price
  const fareClasses: FareClass[] = [
    {
      name: 'Basic',
      cabin: 'Economy',
      price: flight.price * 0.85, // 15% cheaper
      currency: flight.currency,
      features: {
        seatSelection: 'fee',
        carryOn: 1,
        checked: 0,
        changes: 'not-allowed',
        refund: false,
      },
    },
    {
      name: 'Standard',
      cabin: 'Economy',
      price: flight.price,
      currency: flight.currency,
      features: {
        seatSelection: 'free',
        carryOn: 1,
        checked: 1,
        changes: 'fee',
        refund: false,
        meals: true,
      },
    },
    {
      name: 'Flex',
      cabin: 'Economy',
      price: flight.price * 1.15, // 15% more
      currency: flight.currency,
      features: {
        seatSelection: 'included',
        carryOn: 1,
        checked: 1,
        changes: 'included',
        refund: false,
        meals: true,
        wifi: true,
      },
    },
    {
      name: 'Premium Economy',
      cabin: 'Premium Economy',
      price: flight.price * 1.6, // 60% more
      currency: flight.currency,
      features: {
        seatSelection: 'included',
        carryOn: 2,
        checked: 2,
        changes: 'included',
        refund: true,
        meals: true,
        wifi: true,
        priority: true,
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select fare to {flight.destinationName}</h2>
              <p className="mt-1 text-sm text-gray-600">
                This flight is operated by {flight.carrier}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Flight Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departure</p>
                <p className="text-lg font-semibold text-gray-900">{flight.origin}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-sm text-gray-600">{flight.duration}</p>
                <p className="text-xs text-green-600 font-semibold">
                  {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Arrival</p>
                <p className="text-lg font-semibold text-gray-900">{flight.destination}</p>
              </div>
            </div>
          </div>

          {/* Fare Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {fareClasses.map((fareClass) => (
              <div
                key={fareClass.name}
                className="border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all"
              >
                <div className="p-4">
                  {/* Fare Name & Price */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{fareClass.name}</h3>
                    <p className="text-sm text-gray-600">{fareClass.cabin}</p>
                    <div className="mt-2">
                      <p className="text-2xl font-bold text-blue-600">
                        {fareClass.currency === 'USD' ? '$' : fareClass.currency}
                        {Math.round(fareClass.price)}
                      </p>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {/* Seat Selection */}
                    <div className="flex items-start gap-2 text-sm">
                      {fareClass.features.seatSelection === 'included' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Seat choice included</span>
                        </>
                      ) : fareClass.features.seatSelection === 'free' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Seat choice for a fee</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">Seat choice for a fee</span>
                        </>
                      )}
                    </div>

                    {/* Baggage */}
                    <div className="flex items-start gap-2 text-sm">
                      {fareClass.features.carryOn > 0 || fareClass.features.checked > 0 ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-gray-700">
                            <p>Personal item included</p>
                            <p>Carry-on bag included</p>
                            {fareClass.features.checked > 0 && (
                              <p>{fareClass.features.checked}st checked bag included</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">No checked bags</span>
                        </>
                      )}
                    </div>

                    {/* Changes */}
                    <div className="flex items-start gap-2 text-sm">
                      {fareClass.features.changes === 'included' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Changes included</span>
                        </>
                      ) : fareClass.features.changes === 'fee' ? (
                        <>
                          <span className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0 text-xs">$</span>
                          <span className="text-gray-700">Change fee</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">Changes not allowed</span>
                        </>
                      )}
                    </div>

                    {/* Refund */}
                    <div className="flex items-start gap-2 text-sm">
                      {fareClass.features.refund ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Refundable</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">Non-refundable</span>
                        </>
                      )}
                    </div>

                    {/* Additional Amenities */}
                    {fareClass.features.wifi && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Wifi className="w-4 h-4" />
                        <span>Wi-Fi included</span>
                      </div>
                    )}
                    {fareClass.features.meals && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Utensils className="w-4 h-4" />
                        <span>Meals included</span>
                      </div>
                    )}
                    {fareClass.features.priority && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Check className="w-4 h-4" />
                        <span>Priority boarding</span>
                      </div>
                    )}
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => onSelectFare(fareClass)}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
