import { X, Check, Ban, Wifi, Utensils } from 'lucide-react';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { useState } from 'react';

interface FareOption {
  name: string; // Airline-specific name (e.g., "Main Cabin", "Basic Economy")
  price: number;
  currency: string;
  features: {
    seatSelection: 'included' | 'free' | 'fee';
    carryOn: number;
    checked: number;
    changes: 'included' | 'fee' | 'not-allowed';
    refund: 'included' | 'fee' | 'not-allowed';
    meals?: boolean;
    wifi?: boolean;
    priority?: boolean;
  };
}

interface CabinClass {
  cabin: 'Economy' | 'Premium Economy' | 'Business';
  options: FareOption[];
}

interface FareClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: NormalizedFlight;
  onSelectFare: (fareOption: FareOption, cabin: string) => void;
}

export default function FareClassModal({
  isOpen,
  onClose,
  flight,
  onSelectFare,
}: FareClassModalProps) {
  const [selectedCabin, setSelectedCabin] = useState<'Economy' | 'Premium Economy' | 'Business'>('Economy');
  const [selectedFare, setSelectedFare] = useState<FareOption | null>(null);

  if (!isOpen) return null;

  // Get airline name for fare naming
  const airlineName = flight.carrier || 'Airline';

  // Generate cabin classes with airline-specific fare options
  const cabinClasses: CabinClass[] = [
    {
      cabin: 'Economy',
      options: [
        {
          name: `Basic Economy`, // Airlines: United Basic, Delta Basic, etc.
          price: flight.price * 0.85,
          currency: flight.currency,
          features: {
            seatSelection: 'fee',
            carryOn: 1,
            checked: 0,
            changes: 'not-allowed',
            refund: 'not-allowed',
          },
        },
        {
          name: `Main Cabin`, // Standard economy name
          price: flight.price,
          currency: flight.currency,
          features: {
            seatSelection: 'free',
            carryOn: 1,
            checked: 1,
            changes: 'fee',
            refund: 'not-allowed',
            meals: true,
          },
        },
        {
          name: `${airlineName === 'United' ? 'Economy Plus' : airlineName === 'Delta' ? 'Comfort+' : airlineName === 'American' ? 'Main Cabin Extra' : 'Economy Flex'}`,
          price: flight.price * 1.2,
          currency: flight.currency,
          features: {
            seatSelection: 'included',
            carryOn: 1,
            checked: 1,
            changes: 'included',
            refund: 'fee',
            meals: true,
            wifi: true,
            priority: true,
          },
        },
      ],
    },
    {
      cabin: 'Premium Economy',
      options: [
        {
          name: 'Premium Economy',
          price: flight.price * 1.8,
          currency: flight.currency,
          features: {
            seatSelection: 'included',
            carryOn: 2,
            checked: 2,
            changes: 'included',
            refund: 'included',
            meals: true,
            wifi: true,
            priority: true,
          },
        },
      ],
    },
    {
      cabin: 'Business',
      options: [
        {
          name: `${airlineName === 'United' ? 'United Polaris' : airlineName === 'Delta' ? 'Delta One' : airlineName === 'American' ? 'Flagship Business' : 'Business Class'}`,
          price: flight.price * 2.8,
          currency: flight.currency,
          features: {
            seatSelection: 'included',
            carryOn: 2,
            checked: 3,
            changes: 'included',
            refund: 'included',
            meals: true,
            wifi: true,
            priority: true,
          },
        },
      ],
    },
  ];

  const currentCabinClass = cabinClasses.find((c) => c.cabin === selectedCabin)!;
  const lowestPrice = currentCabinClass.options[0];

  // Extract time from ISO datetime (e.g., "2025-10-30T21:25:00" -> "21:25")
  const departureTime = new Date(flight.departure).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const arrivalTime = new Date(flight.arrival).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative inline-block w-full max-w-5xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Select fare to {flight.destinationName}
                  </h2>
                  {/* Inline Flight Timeline */}
                  <div className="flex items-center gap-2 text-sm border-l border-gray-300 pl-4">
                    <span className="font-semibold text-gray-900">{departureTime}</span>
                    <span className="text-gray-500">{flight.origin}</span>
                    <div className="flex flex-col items-center mx-1">
                      <div className="flex items-center">
                        <div className="w-8 h-px bg-gray-300"></div>
                        {flight.carrierLogo ? (
                          <img 
                            src={flight.carrierLogo} 
                            alt={flight.carrier}
                            className="w-5 h-5 rounded-full mx-1 object-contain"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center mx-1 font-bold">
                            {flight.carrier.substring(0, 2)}
                          </div>
                        )}
                        <div className="w-8 h-px bg-gray-300"></div>
                      </div>
                      <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                        {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">{arrivalTime}</span>
                    <span className="text-gray-500">{flight.destination}</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  This flight is operated by {flight.carrier}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cabin Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {cabinClasses.map((cabinClass) => {
              const lowestInClass = cabinClass.options[0];
              return (
                <button
                  key={cabinClass.cabin}
                  onClick={() => {
                    setSelectedCabin(cabinClass.cabin);
                    setSelectedFare(null);
                  }}
                  className={`flex-1 py-4 px-6 text-center border-b-2 transition-colors ${
                    selectedCabin === cabinClass.cabin
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base font-bold">{cabinClass.cabin}</div>
                  <div className="text-sm text-gray-500 mt-1 font-semibold">
                    {lowestInClass.currency === 'USD' ? '$' : lowestInClass.currency}
                    {Math.round(lowestInClass.price)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fare Options in Selected Cabin */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Choose your {selectedCabin} fare
              </h3>
              <p className="text-sm text-gray-500">
                {currentCabinClass.options.length} option
                {currentCabinClass.options.length > 1 ? 's' : ''} available
              </p>
            </div>

            {/* Horizontal Grid of Fare Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCabinClass.options.map((fareOption, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer flex flex-col ${
                  selectedFare?.name === fareOption.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedFare(fareOption)}
              >
                {/* Price & Name - Horizontal Layout like Air Canada */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">{selectedCabin}</p>
                    <p className="font-bold text-gray-900">{fareOption.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase">
                      {fareOption.currency === 'USD' ? 'US' : fareOption.currency}
                    </p>
                    <h4 className="text-2xl font-bold text-gray-900">
                      ${Math.round(fareOption.price)}
                    </h4>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 flex-1">
                  {/* Seat Selection */}
                  <div className="flex items-start gap-2 text-sm">
                    {fareOption.features.seatSelection === 'included' ? (
                      <>
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Seat choice included</span>
                      </>
                    ) : fareOption.features.seatSelection === 'free' ? (
                      <>
                        <Ban className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">Seat choice for a fee</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">Seat choice for a fee</span>
                      </>
                    )}
                  </div>

                  {/* Baggage */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Personal item</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">Carry-on bag</span>
                    </div>
                    {fareOption.features.checked > 0 ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">
                          {fareOption.features.checked} checked bag
                          {fareOption.features.checked > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Ban className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">No checked bags</span>
                      </div>
                    )}
                  </div>

                  {/* Flexibility */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2 text-sm">
                      {fareOption.features.changes === 'included' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Changes included</span>
                        </>
                      ) : fareOption.features.changes === 'fee' ? (
                        <>
                          <span className="text-yellow-600 mt-0.5 flex-shrink-0 text-xs font-bold">
                            $
                          </span>
                          <span className="text-gray-700">Change fee</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">Changes not allowed</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      {fareOption.features.refund === 'included' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Refundable</span>
                        </>
                      ) : fareOption.features.refund === 'fee' ? (
                        <>
                          <span className="text-yellow-600 mt-0.5 flex-shrink-0 text-xs font-bold">
                            $
                          </span>
                          <span className="text-gray-700">Refund fee</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">Non-refundable</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-1">
                    {fareOption.features.wifi ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">Wi-Fi</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Ban className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">No Wi-Fi</span>
                      </div>
                    )}
                    {fareOption.features.meals ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Utensils className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">Meals</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Ban className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">No meals</span>
                      </div>
                    )}
                    {fareOption.features.priority && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">Priority boarding</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => onSelectFare(fareOption, selectedCabin)}
                  className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
