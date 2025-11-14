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
  onSearch?: (params: URLSearchParams) => void; // Optional callback for inline search
}

export default function CondensedFlightSearch({
  initialOrigin = '',
  initialDestination = '',
  initialDepartureDate = '',
  initialReturnDate = '',
  initialPassengers = 1,
  initialTripType = 'round-trip',
  onSearch,
}: CondensedFlightSearchProps) {
  const router = useRouter();
  // Store both display name and code for airports
  const [origin, setOrigin] = useState(initialOrigin);
  const [originCode, setOriginCode] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [destinationCode, setDestinationCode] = useState(initialDestination);
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
  
  // Multi-city flights state
  const [multiCityFlights, setMultiCityFlights] = useState([
    { origin: '', originCode: '', destination: '', destinationCode: '', date: '' },
    { origin: '', originCode: '', destination: '', destinationCode: '', date: '' },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tripType === 'multi-city') {
      // Build multi-city search params
      const params = new URLSearchParams({
        tripType: 'multi-city',
        adults: travelers.adults.toString(),
        children: travelers.children.toString(),
        infantsLap: travelers.infantsLap.toString(),
        infantsSeat: travelers.infantsSeat.toString(),
        cabin: travelers.cabin,
      });

      multiCityFlights.forEach((flight, index) => {
        const segmentNum = index + 1;
        params.append(`origin${segmentNum}`, flight.originCode.toUpperCase());
        params.append(`destination${segmentNum}`, flight.destinationCode.toUpperCase());
        params.append(`date${segmentNum}`, flight.date);
      });

      // If onSearch callback provided, call it; otherwise navigate
      if (onSearch) {
        onSearch(params);
      } else {
        router.push(`/flights?${params.toString()}`);
      }
      return;
    }
    
    const params = new URLSearchParams({
      origin: originCode.toUpperCase(),
      destination: destinationCode.toUpperCase(),
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

    // If onSearch callback provided, call it; otherwise navigate
    if (onSearch) {
      onSearch(params);
    } else {
      router.push(`/flights?${params.toString()}`);
    }
  };

  const handleSwap = () => {
    const tempDisplay = origin;
    const tempCode = originCode;
    setOrigin(destination);
    setOriginCode(destinationCode);
    setDestination(tempDisplay);
    setDestinationCode(tempCode);
  };

  const handleAddFlight = () => {
    setMultiCityFlights([
      ...multiCityFlights,
      { origin: '', originCode: '', destination: '', destinationCode: '', date: '' },
    ]);
  };

  const handleRemoveFlight = (index: number) => {
    if (multiCityFlights.length > 2) {
      setMultiCityFlights(multiCityFlights.filter((_, i) => i !== index));
    }
  };

  const handleMultiCitySwap = (index: number) => {
    const newFlights = [...multiCityFlights];
    const temp = {
      origin: newFlights[index].origin,
      originCode: newFlights[index].originCode,
    };
    newFlights[index].origin = newFlights[index].destination;
    newFlights[index].originCode = newFlights[index].destinationCode;
    newFlights[index].destination = temp.origin;
    newFlights[index].destinationCode = temp.originCode;
    setMultiCityFlights(newFlights);
  };

  const updateMultiCityFlight = (index: number, field: string, value: string) => {
    const newFlights = [...multiCityFlights];
    (newFlights[index] as any)[field] = value;
    setMultiCityFlights(newFlights);
  };

  return (
    <div className="bg-white dark:bg-static-bg-800 border-b border-static-bg-200 dark:border-static-bg-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <form onSubmit={handleSearch}>
          {/* Trip Type Tabs */}
          <div className="flex gap-6 mb-4">
            <button
              type="button"
              onClick={() => setTripType('round-trip')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                tripType === 'round-trip'
                  ? 'border-static-accent-600 text-static-accent-600 dark:border-static-accent-400 dark:text-static-accent-400'
                  : 'border-transparent text-static-text-600 hover:text-static-text-900 dark:text-static-text-400 dark:hover:text-static-text-100'
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
                  ? 'border-static-accent-600 text-static-accent-600 dark:border-static-accent-400 dark:text-static-accent-400'
                  : 'border-transparent text-static-text-600 hover:text-static-text-900 dark:text-static-text-400 dark:hover:text-static-text-100'
              }`}
            >
              One-way
            </button>
            <button
              type="button"
              onClick={() => setTripType('multi-city')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                tripType === 'multi-city'
                  ? 'border-static-accent-600 text-static-accent-600 dark:border-static-accent-400 dark:text-static-accent-400'
                  : 'border-transparent text-static-text-600 hover:text-static-text-900 dark:text-static-text-400 dark:hover:text-static-text-100'
              }`}
            >
              Multi-city
            </button>
          </div>

          {/* Condensed Search Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_auto_1.7fr_1.6fr_1.4fr_auto] gap-2 items-end">
            {/* Origin */}
            <div className="flex-[1.7]">
              <label className="block text-xs font-semibold text-static-text-700 dark:text-static-text-300 mb-2 uppercase tracking-wide">
                Leaving from
              </label>
              <div className="relative">
                <div className="flex items-center h-12 border border-static-gray-400 dark:border-static-bg-600 rounded-xl bg-transparent px-4 hover:border-static-accent-500 dark:hover:border-static-accent-400 focus-within:border-static-accent-500 dark:focus-within:border-static-accent-400 transition-colors">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-3" />
                  <AirportAutocomplete
                    id="origin-condensed"
                    label=""
                    value={origin}
                    onChange={setOrigin}
                    onSelect={(airport) => {
                      const displayName = `${airport.city} (${airport.iataCode})`;
                      setOrigin(displayName);
                      setOriginCode(airport.iataCode);
                    }}
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
              className="mb-1 -mx-3 h-10 w-10 flex items-center justify-center border border-static-gray-400 dark:border-static-bg-600 rounded-full bg-white dark:bg-static-bg-800 hover:bg-static-bg-100 dark:hover:bg-static-bg-700 transition-colors shadow-sm flex-shrink-0 z-20"
            >
              <ArrowLeftRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Destination */}
            <div className="flex-[1.7]">
              <label className="block text-xs font-semibold text-static-text-700 dark:text-static-text-300 mb-2 uppercase tracking-wide">
                Going to
              </label>
              <div className="relative">
                <div className="flex items-center h-12 border border-static-gray-400 dark:border-static-bg-600 rounded-xl bg-transparent px-4 hover:border-static-accent-500 dark:hover:border-static-accent-400 focus-within:border-static-accent-500 dark:focus-within:border-static-accent-400 transition-colors">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-3" />
                  <AirportAutocomplete
                    id="destination-condensed"
                    label=""
                    value={destination}
                    onChange={setDestination}
                    onSelect={(airport) => {
                      const displayName = `${airport.city} (${airport.iataCode})`;
                      setDestination(displayName);
                      setDestinationCode(airport.iataCode);
                    }}
                    placeholder="City or airport"
                    inline
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="flex-[1.6]">
              <label className="block text-xs font-semibold text-static-text-700 dark:text-static-text-300 mb-2 uppercase tracking-wide">
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
              <label className="block text-xs font-semibold text-static-text-700 dark:text-static-text-300 mb-2 uppercase tracking-wide">
                Travelers
              </label>
              <TravelersSelector value={travelers} onChange={setTravelers} />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="flex-shrink-0 h-12 px-10 bg-static-accent-600 hover:bg-static-accent-700 dark:bg-static-accent-500 dark:hover:bg-static-accent-600 text-white font-bold rounded-xl transition-colors shadow-lg mb-1 ml-6"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
