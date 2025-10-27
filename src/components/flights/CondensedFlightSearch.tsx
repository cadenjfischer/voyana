'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, MapPin } from 'lucide-react';
import AirportAutocomplete from './AirportAutocomplete';
import AirlineDatePicker from '../AirlineDatePicker';
import TravelersSelector, { TravelersValue } from './TravelersSelector';

interface CondensedFlightSearchProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDepartureDate?: string;
  initialReturnDate?: string;
  initialPassengers?: number;
  initialTripType?: 'one-way' | 'round-trip' | 'multi-city';
}

export default function CondensedFlightSearch({
  initialOrigin = '',
  initialDestination = '',
  initialDepartureDate = '',
  initialReturnDate = '',
  initialPassengers = 1,
  initialTripType = 'round-trip',
}: CondensedFlightSearchProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [departureDate, setDepartureDate] = useState(initialDepartureDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [travelers, setTravelers] = useState<TravelersValue>({
    adults: initialPassengers || 1,
    children: 0,
    infantsLap: 0,
    infantsSeat: 0,
    cabin: 'ECONOMY',
  });
  const [tripType, setTripType] = useState<'one-way' | 'round-trip' | 'multi-city'>(initialTripType);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      adults: travelers.adults.toString(),
      children: travelers.children.toString(),
      infantsLap: travelers.infantsLap.toString(),
      infantsSeat: travelers.infantsSeat.toString(),
      cabin: travelers.cabin,
    });

    if (tripType === 'round-trip' && returnDate) {
      params.append('returnDate', returnDate);
    }

    router.push(`/flights?${params.toString()}`);
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <form onSubmit={handleSearch}>
          {/* Trip Type Tabs */}
          <div className="flex gap-6 mb-4">
            <button
              type="button"
              onClick={() => setTripType('round-trip')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                tripType === 'round-trip'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Roundtrip
            </button>
            <button
              type="button"
              onClick={() => {
                setTripType('one-way');
                setReturnDate('');
              }}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                tripType === 'one-way'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              One-way
            </button>
            <button
              type="button"
              onClick={() => setTripType('multi-city')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                tripType === 'multi-city'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Multi-city
            </button>
          </div>

          {/* Condensed Search Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_auto_1.7fr_1.6fr_1.4fr_auto] gap-2 items-end">
            {/* Origin */}
            <div className="flex-[1.7]">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Leaving from
              </label>
              <div className="relative">
                <div className="flex items-center h-12 border border-gray-300 rounded-xl bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                  <AirportAutocomplete
                    id="origin-condensed"
                    label=""
                    value={origin}
                    onChange={setOrigin}
                    placeholder="City or airport"
                    inline
                  />
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              className="mb-1 -mx-3 h-10 w-10 flex items-center justify-center border border-gray-300 rounded-full bg-white hover:border-gray-400 transition-colors shadow-sm flex-shrink-0 z-20 ring-4 ring-white"
            >
              <ArrowLeftRight className="w-4 h-4 text-gray-600" />
            </button>

            {/* Destination */}
            <div className="flex-[1.7]">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Going to
              </label>
              <div className="relative">
                <div className="flex items-center h-12 border border-gray-300 rounded-xl bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                  <AirportAutocomplete
                    id="destination-condensed"
                    label=""
                    value={destination}
                    onChange={setDestination}
                    placeholder="City or airport"
                    inline
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="flex-[1.6]">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                {tripType === 'one-way' ? 'Date' : 'Dates'}
              </label>
              <AirlineDatePicker
                startDate={departureDate}
                endDate={tripType === 'round-trip' ? returnDate : undefined}
                onStartDateChange={setDepartureDate}
                onEndDateChange={setReturnDate}
                single={tripType === 'one-way'}
              />
            </div>

            {/* Travelers */}
            <div className="flex-[1.4]">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Travelers
              </label>
              <TravelersSelector value={travelers} onChange={setTravelers} />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="flex-shrink-0 h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg mb-1 ml-6"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
