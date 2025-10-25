'use client';

import { useState } from 'react';
import FlightSearch from '@/components/flights/FlightSearch';
import FlightResults from '@/components/flights/FlightResults';
import MyBookings from '@/components/flights/MyBookings';
import { NormalizedFlight } from '@/lib/api/duffelClient';

export default function FlightsPage() {
  const [searchResults, setSearchResults] = useState<NormalizedFlight[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'bookings'>('search');
  const [passengerCount, setPassengerCount] = useState(1);

  const handleSearch = async (results: NormalizedFlight[], passengers: number) => {
    setSearchResults(results);
    setPassengerCount(passengers);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold mb-2">Flight Search</h1>
          <p className="text-blue-100">Find and book the best flights from multiple airlines</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search Flights
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bookings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' ? (
          <div className="space-y-8">
            {/* Search Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <FlightSearch onSearch={handleSearch} onSearching={setIsSearching} />
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {searchResults.length} Flights Found
                </h2>
                <FlightResults 
                  flights={searchResults} 
                  passengerCount={passengerCount}
                  onFlightBooked={() => setActiveTab('bookings')}
                />
              </div>
            )}

            {/* No results state */}
            {!isSearching && searchResults.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No flights yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by searching for flights above.
                </p>
              </div>
            )}
          </div>
        ) : (
          <MyBookings />
        )}
      </div>
    </div>
  );
}
