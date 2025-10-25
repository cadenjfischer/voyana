'use client';

import { useState } from 'react';
import FlightSearch from '@/components/flights/FlightSearch';
import FlightResults from '@/components/flights/FlightResults';
import MyBookings from '@/components/flights/MyBookings';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { Plane } from 'lucide-react';
import Header from '@/components/Header';

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
      <Header />
      
      {/* Header - Compact */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Flight Search</h1>
          </div>
        </div>
      </div>

      {/* Tabs - Compact & Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-3 px-4 font-semibold text-sm transition-all relative ${
                activeTab === 'search'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Search Flights
              {activeTab === 'search' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-3 px-4 font-semibold text-sm transition-all relative ${
                activeTab === 'bookings'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Bookings
              {activeTab === 'bookings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content - Compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'search' ? (
          <div className="space-y-4">
            {/* Search Form */}
            <FlightSearch onSearch={handleSearch} onSearching={setIsSearching} />

            {/* Loading State */}
            {isSearching && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Searching flights...</h3>
                    <p className="text-sm text-gray-600">Comparing prices across multiple airlines</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!isSearching && searchResults.length > 0 && (
              <div>
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    Available Flights
                  </h2>
                </div>
                <FlightResults 
                  flights={searchResults} 
                  passengerCount={passengerCount}
                  onFlightBooked={() => setActiveTab('bookings')}
                />
              </div>
            )}

            {/* No results state */}
            {!isSearching && searchResults.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <Plane className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to fly?</h3>
                  <p className="text-gray-600 max-w-md">
                    Enter your travel details above to find the best flight deals
                  </p>
                </div>
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
