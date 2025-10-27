'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { Plane, Bed, Car, Package, MapPin, Ship, ArrowLeftRight } from 'lucide-react';
import AirportAutocomplete from '@/components/flights/AirportAutocomplete';
import AirlineDatePicker from '@/components/AirlineDatePicker';

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

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

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

            {/* Flight Search Form - Expedia Style */}
            {activeTab === 'flights' && (
              <form onSubmit={handleFlightSearch} className="space-y-6">
                {/* Trip Type */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tripType"
                      value="round-trip"
                      checked={tripType === 'round-trip'}
                      onChange={(e) => setTripType(e.target.value as 'round-trip')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 font-medium">Round-trip</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tripType"
                      value="one-way"
                      checked={tripType === 'one-way'}
                      onChange={(e) => {
                        setTripType(e.target.value as 'one-way');
                        setReturnDate('');
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 font-medium">One-way</span>
                  </label>
                </div>

                {/* Search Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Leaving From - col-span-3 */}
                  <div className="md:col-span-3">
                    <AirportAutocomplete
                      id="origin"
                      label="Leaving from"
                      value={origin}
                      onChange={setOrigin}
                      placeholder="City or airport"
                    />
                  </div>

                  {/* Swap Button - col-span-1 */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center">
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="p-3 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                    >
                      <ArrowLeftRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Going To - col-span-3 */}
                  <div className="md:col-span-3">
                    <AirportAutocomplete
                      id="destination"
                      label="Going to"
                      value={destination}
                      onChange={setDestination}
                      placeholder="City or airport"
                    />
                  </div>

                  {/* Dates - col-span-3 */}
                  <div className="md:col-span-3">
                    <AirlineDatePicker
                      startDate={departureDate}
                      endDate={tripType === 'round-trip' ? returnDate : undefined}
                      onStartDateChange={setDepartureDate}
                      onEndDateChange={setReturnDate}
                    />
                  </div>

                  {/* Travelers - col-span-2 */}
                  <div className="md:col-span-2">
                    <div className="relative h-full">
                      <label className="absolute top-3 left-4 text-xs font-medium text-gray-600 z-10 pointer-events-none">
                        Travelers
                      </label>
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(parseInt(e.target.value))}
                        className="w-full h-full min-h-[60px] px-4 pt-8 pb-3 border-2 border-gray-300 rounded-xl hover:border-blue-500 focus:border-blue-500 transition-colors bg-white text-base font-medium text-gray-900 cursor-pointer focus:ring-0 focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <option key={num} value={num}>
                            {num} traveler{num > 1 ? 's' : ''}, Economy
                          </option>
                        ))}
                      </select>
                    </div>
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
