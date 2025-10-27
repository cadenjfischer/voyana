'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, ArrowLeftRight } from 'lucide-react';
import AirportAutocomplete from './AirportAutocomplete';
import AirlineDatePicker from '../AirlineDatePicker';

interface CondensedFlightSearchProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDepartureDate?: string;
  initialReturnDate?: string;
  initialPassengers?: number;
  initialTripType?: 'one-way' | 'round-trip';
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
  const [passengers, setPassengers] = useState(initialPassengers);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(initialTripType);
  
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [showTravelersDropdown, setShowTravelersDropdown] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const travelersRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
      if (travelersRef.current && !travelersRef.current.contains(event.target as Node)) {
        setShowTravelersDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      passengers: passengers.toString(),
    });

    if (tripType === 'round-trip' && returnDate) {
      params.append('returnDate', returnDate);
    }

    router.push(`/flights/loading-search?${params.toString()}`);
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Trip Type Tabs */}
        <div className="flex gap-6 mb-4">
          <button
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
            disabled
            className="text-sm font-semibold pb-2 border-b-2 border-transparent text-gray-400 cursor-not-allowed"
          >
            Multi-city
          </button>
        </div>

        {/* Condensed Search Bar */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
          {/* Origin */}
          <div ref={originRef} className="flex-1 relative">
            <button
              onClick={() => setShowOriginDropdown(!showOriginDropdown)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-l-lg"
            >
              <div className="text-xs text-gray-500 mb-1">Leaving from</div>
              <div className="font-semibold text-gray-900 truncate">
                {origin || 'City or airport'}
              </div>
            </button>
            {showOriginDropdown && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] p-4">
                <AirportAutocomplete
                  id="origin-condensed"
                  label="Leaving from"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="City or airport"
                />
                <button
                  onClick={() => setShowOriginDropdown(false)}
                  className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftRight className="w-5 h-5 text-gray-600" />
          </button>

          {/* Destination */}
          <div ref={destinationRef} className="flex-1 relative border-l border-gray-200">
            <button
              onClick={() => setShowDestinationDropdown(!showDestinationDropdown)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs text-gray-500 mb-1">Going to</div>
              <div className="font-semibold text-gray-900 truncate">
                {destination || 'City or airport'}
              </div>
            </button>
            {showDestinationDropdown && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] p-4">
                <AirportAutocomplete
                  id="destination-condensed"
                  label="Going to"
                  value={destination}
                  onChange={setDestination}
                  placeholder="City or airport"
                />
                <button
                  onClick={() => setShowDestinationDropdown(false)}
                  className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex-1 border-l border-gray-200">
            <AirlineDatePicker
              startDate={departureDate}
              endDate={tripType === 'round-trip' ? returnDate : undefined}
              onStartDateChange={setDepartureDate}
              onEndDateChange={setReturnDate}
              className=""
              compact={true}
            />
          </div>

          {/* Travelers */}
          <div ref={travelersRef} className="flex-1 relative border-l border-gray-200">
            <button
              onClick={() => setShowTravelersDropdown(!showTravelersDropdown)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs text-gray-500 mb-1">Travelers, Cabin class</div>
              <div className="font-semibold text-gray-900 truncate">
                {passengers} traveler{passengers > 1 ? 's' : ''}, Economy
              </div>
            </button>
            {showTravelersDropdown && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Travelers
                    </label>
                    <select
                      value={passengers}
                      onChange={(e) => setPassengers(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <option key={num} value={num}>
                          {num} traveler{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setShowTravelersDropdown(false)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-r-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
