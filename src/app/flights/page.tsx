'use client';

import { useState } from 'react';
import FlightSearch from '@/components/flights/FlightSearch';
import FlightResults from '@/components/flights/FlightResults';
import MyBookings from '@/components/flights/MyBookings';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { Plane } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header - Trip.com Style */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Plane className="h-8 w-8" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight">Flight Search</h1>
          </div>
          <p className="text-lg text-blue-100">Find and book the best flights from multiple airlines</p>
        </div>
      </div>

      {/* Tabs - Trip.com Style */}
      <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-6 font-bold text-base transition-all relative ${
                activeTab === 'search'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Search Flights
              {activeTab === 'search' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-6 font-bold text-base transition-all relative ${
                activeTab === 'bookings'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Bookings
              {activeTab === 'bookings' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' ? (
          <div className="space-y-8">
            {/* Search Form */}
            <FlightSearch onSearch={handleSearch} onSearching={setIsSearching} />

            {/* Loading State */}
            {isSearching && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Searching flights...</h3>
                    <p className="text-gray-600">We're comparing prices across multiple airlines</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!isSearching && searchResults.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Available Flights
                  </h2>
                  <p className="text-gray-600">
                    Found <span className="font-bold text-blue-600">{searchResults.length}</span> flights for your search
                  </p>
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
              <div className="bg-white rounded-xl shadow-lg p-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="p-6 bg-blue-50 rounded-full mb-6">
                    <Plane className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to fly?</h3>
                  <p className="text-gray-600 text-lg max-w-md">
                    Enter your travel details above to find the best flight deals from multiple airlines
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
