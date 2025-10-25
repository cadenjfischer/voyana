'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { ArrowLeftRight, Calendar, Users } from 'lucide-react';
import AirportAutocomplete from './AirportAutocomplete';

interface FlightSearchProps {
  onSearch: (results: NormalizedFlight[], passengers: number) => void;
  onSearching: (isSearching: boolean) => void;
}

export default function FlightSearch({ onSearch, onSearching }: FlightSearchProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('economy');
  const [tripType, setTripType] = useState<'one-way' | 'round-trip' | 'multi-city'>('round-trip');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    onSearching(true);

    try {
      const params = new URLSearchParams({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate,
        passengers: passengers.toString(),
        cabinClass,
      });

      if (tripType === 'round-trip' && returnDate) {
        params.append('returnDate', returnDate);
      }

      const response = await fetch(`/api/flights/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search flights');
      }

      onSearch(data.flights, passengers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
      onSearching(false);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Trip Type Radio Buttons - Compact */}
        <div className="flex items-center gap-4 pb-3 border-b border-gray-200">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="radio"
              name="tripType"
              value="round-trip"
              checked={tripType === 'round-trip'}
              onChange={(e) => setTripType(e.target.value as 'round-trip' | 'one-way' | 'multi-city')}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Round-trip
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="radio"
              name="tripType"
              value="one-way"
              checked={tripType === 'one-way'}
              onChange={(e) => setTripType(e.target.value as 'round-trip' | 'one-way' | 'multi-city')}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              One-way
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="radio"
              name="tripType"
              value="multi-city"
              checked={tripType === 'multi-city'}
              onChange={(e) => setTripType(e.target.value as 'round-trip' | 'one-way' | 'multi-city')}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Multi-city
            </span>
          </label>
        </div>

        {/* Origin and Destination with Swap Button - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <AirportAutocomplete
            id="origin"
            label="From"
            value={origin}
            onChange={setOrigin}
            placeholder="City or airport"
          />

          <button
            type="button"
            onClick={handleSwap}
            className="mb-0.5 p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all transform hover:scale-110 group"
            aria-label="Swap origin and destination"
          >
            <ArrowLeftRight className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
          </button>

          <AirportAutocomplete
            id="destination"
            label="To"
            value={destination}
            onChange={setDestination}
            placeholder="City or airport"
          />
        </div>

        {/* Date Fields, Passengers, and Cabin Class - Compact */}
        <div className={`grid grid-cols-2 gap-2 ${tripType === 'round-trip' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div>
            <label htmlFor="departureDate" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Departure
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                id="departureDate"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={today}
                required
                className="w-full pl-9 pr-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium text-sm transition-all"
              />
            </div>
          </div>

          {tripType === 'round-trip' && (
            <div>
              <label htmlFor="returnDate" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Return
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  id="returnDate"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate || today}
                  required={tripType === 'round-trip'}
                  className="w-full pl-9 pr-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="passengers" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Passengers
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <select
                id="passengers"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="w-full pl-9 pr-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium text-sm appearance-none bg-white cursor-pointer transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="cabinClass" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Class
            </label>
            <select
              id="cabinClass"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium text-sm appearance-none bg-white cursor-pointer transition-all"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-xs font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button - Compact */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-4 rounded-lg font-bold text-base hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            'Search Flights'
          )}
        </button>
      </form>
    </div>
  );
}
