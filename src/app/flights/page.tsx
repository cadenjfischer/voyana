'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CondensedFlightSearch from '@/components/flights/CondensedFlightSearch';
import FlightResults from '@/components/flights/FlightResults';
import MyBookings from '@/components/flights/MyBookings';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { Plane } from 'lucide-react';
import Header from '@/components/Header';

export default function FlightsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<NormalizedFlight[]>([]);
  const [multiCityResults, setMultiCityResults] = useState<NormalizedFlight[][] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'bookings'>('search');
  const [passengerCount, setPassengerCount] = useState(1);
  const [isMultiCity, setIsMultiCity] = useState(false);

  // Restore search results on page load if URL params exist
  useEffect(() => {
    const tripType = searchParams.get('tripType');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const returnDate = searchParams.get('returnDate');
    const adults = searchParams.get('adults');
    const children = searchParams.get('children');
    const infantsLap = searchParams.get('infantsLap');
    const infantsSeat = searchParams.get('infantsSeat');
    
    // Calculate total passengers
    const totalPassengers = parseInt(adults || '1') + 
                           parseInt(children || '0') + 
                           parseInt(infantsLap || '0') + 
                           parseInt(infantsSeat || '0');
    setPassengerCount(totalPassengers);

    // Check if it's a multi-city search
    if (tripType === 'multi-city') {
      setIsMultiCity(true);
      setIsSearching(true);
      
      // Build multi-city search params
      const params = new URLSearchParams();
      params.append('adults', adults || '1');
      params.append('children', children || '0');
      params.append('infantsLap', infantsLap || '0');
      params.append('infantsSeat', infantsSeat || '0');
      params.append('cabin', searchParams.get('cabin') || 'ECONOMY');
      
      // Add all flight segments
      let segmentIndex = 1;
      while (searchParams.get(`origin${segmentIndex}`)) {
        params.append(`origin${segmentIndex}`, searchParams.get(`origin${segmentIndex}`)!);
        params.append(`destination${segmentIndex}`, searchParams.get(`destination${segmentIndex}`)!);
        params.append(`date${segmentIndex}`, searchParams.get(`date${segmentIndex}`)!);
        segmentIndex++;
      }
      
      // Fetch multi-city flights
      fetch(`/api/flights/search-multi?${params}`)
        .then(res => res.json())
        .then(data => {
          if (data.legs) {
            setMultiCityResults(data.legs);
          }
        })
        .catch(error => {
          console.error('Failed to search multi-city flights:', error);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else if (origin && destination && departureDate) {
      // Regular one-way or round-trip search
      setIsMultiCity(false);
      setIsSearching(true);
      
      // Fetch the flights
      const params = new URLSearchParams({
        origin,
        destination,
        departureDate,
        passengers: totalPassengers.toString(),
      });
      
      if (returnDate) {
        params.append('returnDate', returnDate);
      }

      fetch(`/api/flights/search?${params}`)
        .then(res => res.json())
        .then(data => {
          if (data.flights) {
            setSearchResults(data.flights);
          }
        })
        .catch(error => {
          console.error('Failed to restore search:', error);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, []); // Only run on mount

  const handleSearch = async (results: NormalizedFlight[], passengers: number) => {
    setSearchResults(results);
    setPassengerCount(passengers);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Condensed Search Bar */}
      <div className="mt-16">
        <CondensedFlightSearch
          initialOrigin={searchParams.get('origin') || ''}
          initialDestination={searchParams.get('destination') || ''}
          initialDepartureDate={searchParams.get('departureDate') || ''}
          initialReturnDate={searchParams.get('returnDate') || ''}
          initialPassengers={searchParams.get('passengers') ? parseInt(searchParams.get('passengers')!) : 1}
          initialTripType={searchParams.get('returnDate') ? 'round-trip' : 'one-way'}
        />
      </div>

      {/* Tabs - Compact & Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10 shadow-sm">
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
            {!isSearching && !isMultiCity && searchResults.length > 0 && (
              <div>
                <FlightResults 
                  flights={searchResults} 
                  passengerCount={passengerCount}
                  onFlightBooked={() => setActiveTab('bookings')}
                />
              </div>
            )}

            {/* Multi-City Results */}
            {!isSearching && isMultiCity && multiCityResults && multiCityResults.length > 0 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-1">Multi-City Journey</h3>
                  <p className="text-sm text-blue-700">
                    Select one flight for each leg of your journey. Total price will be calculated at checkout.
                  </p>
                </div>
                
                {multiCityResults.map((legFlights, legIndex) => (
                  <div key={legIndex} className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      Flight {legIndex + 1}
                    </h3>
                    <FlightResults 
                      flights={legFlights} 
                      passengerCount={passengerCount}
                      onFlightBooked={() => setActiveTab('bookings')}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* No results state */}
            {!isSearching && !isMultiCity && searchResults.length === 0 && (
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

