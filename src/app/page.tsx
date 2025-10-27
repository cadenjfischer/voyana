'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { Plane, Bed, Car, Package, MapPin, Ship } from 'lucide-react';
import AirportAutocomplete from '@/components/flights/AirportAutocomplete';
import { format } from 'date-fns';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'flights' | 'stays' | 'cars' | 'packages' | 'things' | 'cruises'>('flights');
  
  // Flight search state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('round-trip');

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      passengers: passengers.toString(),
    });

    if (tripType === 'round-trip' && returnDate) {
      params.append('returnDate', returnDate);
    }

    // Navigate to loading page with search params
    router.push(`/flights/loading-search?${params.toString()}`);
  };

  // Get today's date for min date
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section with Search */}
      <div 
        className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/70 to-indigo-900/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4">
            Made to Travel
          </h1>
          <p className="text-xl text-center text-blue-100 mb-12">
            Book flights, hotels, and more with Voyana
          </p>

          {/* Search Card */}
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('flights')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'flights' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Plane className="w-5 h-5" />
                <span>Flights</span>
                {activeTab === 'flights' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('stays')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'stays' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <Bed className="w-5 h-5" />
                <span>Stays</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('cars')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'cars' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <Car className="w-5 h-5" />
                <span>Cars</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('packages')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'packages' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <Package className="w-5 h-5" />
                <span>Packages</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('things')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'things' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <MapPin className="w-5 h-5" />
                <span>Things to do</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('cruises')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'cruises' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <Ship className="w-5 h-5" />
                <span>Cruises</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>
            </div>

            {/* Flight Search Form */}
            {activeTab === 'flights' && (
              <form onSubmit={handleFlightSearch} className="space-y-4">
                {/* Trip Type */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tripType"
                      value="round-trip"
                      checked={tripType === 'round-trip'}
                      onChange={(e) => setTripType(e.target.value as 'round-trip')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 font-medium">Round-trip</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tripType"
                      value="one-way"
                      checked={tripType === 'one-way'}
                      onChange={(e) => setTripType(e.target.value as 'one-way')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 font-medium">One-way</span>
                  </label>
                </div>

                {/* Origin and Destination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AirportAutocomplete
                    id="origin"
                    label="Leaving from"
                    value={origin}
                    onChange={setOrigin}
                    placeholder="City or airport"
                  />
                  <AirportAutocomplete
                    id="destination"
                    label="Going to"
                    value={destination}
                    onChange={setDestination}
                    placeholder="City or airport"
                  />
                </div>

                {/* Dates and Travelers */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="departure" className="block text-sm font-semibold text-gray-700 mb-2">
                      Departure
                    </label>
                    <input
                      type="date"
                      id="departure"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={today}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {tripType === 'round-trip' && (
                    <div>
                      <label htmlFor="return" className="block text-sm font-semibold text-gray-700 mb-2">
                        Return
                      </label>
                      <input
                        type="date"
                        id="return"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        min={departureDate || today}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="passengers" className="block text-sm font-semibold text-gray-700 mb-2">
                      Travelers
                    </label>
                    <select
                      id="passengers"
                      value={passengers}
                      onChange={(e) => setPassengers(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <option key={num} value={num}>
                          {num} traveler{num > 1 ? 's' : ''}, Economy
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-lg shadow-lg"
                >
                  Search
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Plane className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Compare flights from multiple airlines to find the best deals
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">All-in-One</h3>
              <p className="text-gray-600">
                Book flights, hotels, cars, and activities in one place
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Travel Planning</h3>
              <p className="text-gray-600">
                Plan your entire trip with our comprehensive itinerary tools
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
