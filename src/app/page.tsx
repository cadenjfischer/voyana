'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { Plane, Bed, Car, Package, MapPin, Ship, ArrowLeftRight } from 'lucide-react';
import AirportAutocomplete from '@/components/flights/AirportAutocomplete';
import AirlineDatePicker from '@/components/AirlineDatePicker';
import { format } from 'date-fns';
import TravelersSelector, { TravelersValue } from '@/components/flights/TravelersSelector';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'flights' | 'stays' | 'cars' | 'packages' | 'things' | 'cruises'>('flights');
  
  // Flight search state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelers, setTravelers] = useState<TravelersValue>({
    adults: 1,
    children: 0,
    infantsLap: 0,
    infantsSeat: 0,
    cabin: 'ECONOMY',
  });
  const [tripType, setTripType] = useState<'one-way' | 'round-trip' | 'multi-city'>('round-trip');

  // Multi-city flights state
  interface FlightSegment {
    id: string;
    origin: string;
    destination: string;
    date: string;
  }
  
  const [multiCityFlights, setMultiCityFlights] = useState<FlightSegment[]>([
    { id: '1', origin: '', destination: '', date: '' },
    { id: '2', origin: '', destination: '', date: '' },
  ]);

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tripType === 'multi-city') {
      // Build query params for multi-city
      const params = new URLSearchParams({
        tripType: 'multi-city',
        adults: travelers.adults.toString(),
        children: travelers.children.toString(),
        infantsLap: travelers.infantsLap.toString(),
        infantsSeat: travelers.infantsSeat.toString(),
        cabin: travelers.cabin,
      });

      // Add each flight segment
      multiCityFlights.forEach((flight, index) => {
        params.append(`origin${index + 1}`, flight.origin.toUpperCase());
        params.append(`destination${index + 1}`, flight.destination.toUpperCase());
        params.append(`date${index + 1}`, flight.date);
      });

      // Navigate to flights page with search params
      router.push(`/flights?${params.toString()}`);
    } else {
      // Build query params for one-way and round-trip
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

      // Navigate to flights page with search params
      router.push(`/flights?${params.toString()}`);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const addMultiCityFlight = () => {
    const newId = (multiCityFlights.length + 1).toString();
    setMultiCityFlights([...multiCityFlights, { id: newId, origin: '', destination: '', date: '' }]);
  };

  const removeMultiCityFlight = (id: string) => {
    if (multiCityFlights.length > 2) {
      setMultiCityFlights(multiCityFlights.filter(f => f.id !== id));
    }
  };

  const updateMultiCityFlight = (id: string, field: keyof FlightSegment, value: string) => {
    setMultiCityFlights(multiCityFlights.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-3 sm:mb-4">
            Made to Travel
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-center text-blue-100 mb-8 sm:mb-10 lg:mb-12">
            Book flights, hotels, and more with Voyana
          </p>

          {/* Search Card */}
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-7xl mx-auto overflow-visible">
            {/* Tabs */}
            <div className="flex gap-4 sm:gap-6 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('flights')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'flights' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Plane className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Flights</span>
                {activeTab === 'flights' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('stays')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'stays' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <Bed className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Stays</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('cars')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'cars' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Cars</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('packages')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'packages' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Packages</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('things')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'things' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
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
                      onChange={(e) => setTripType(e.target.value as 'one-way')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 font-medium">One-way</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tripType"
                      value="multi-city"
                      checked={tripType === 'multi-city'}
                      onChange={(e) => setTripType(e.target.value as 'multi-city')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900 font-medium">Multi-city</span>
                  </label>
                </div>

                {/* Search Fields - Responsive Layout */}
                <div className="space-y-4">
                  {/* Multi-city mode */}
                  {tripType === 'multi-city' ? (
                    <div className="space-y-4">
                      {/* Travelers - Shared across all flights */}
                      <div className="w-80">
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Travelers
                        </label>
                        <TravelersSelector value={travelers} onChange={setTravelers} />
                      </div>

                      {multiCityFlights.map((flight, index) => (
                        <div key={flight.id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">Flight {index + 1}</h3>
                            {multiCityFlights.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeMultiCityFlight(flight.id)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-[2fr_auto_2fr_1.5fr] gap-3 items-end">
                            {/* Leaving From */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                Leaving from
                              </label>
                              <div className="flex items-center h-12 border border-gray-300 rounded-xl bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                                <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                                <AirportAutocomplete
                                  id={`multi-origin-${flight.id}`}
                                  label=""
                                  value={flight.origin}
                                  onChange={(value) => updateMultiCityFlight(flight.id, 'origin', value)}
                                  placeholder="City or airport"
                                  inline
                                />
                              </div>
                            </div>

                            {/* Swap Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const temp = flight.origin;
                                updateMultiCityFlight(flight.id, 'origin', flight.destination);
                                updateMultiCityFlight(flight.id, 'destination', temp);
                              }}
                              className="mb-1 h-10 w-10 flex items-center justify-center border border-gray-300 rounded-full bg-white hover:border-gray-400 transition-colors shadow-sm flex-shrink-0"
                            >
                              <ArrowLeftRight className="w-4 h-4 text-gray-600" />
                            </button>

                            {/* Going To */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                Going to
                              </label>
                              <div className="flex items-center h-12 border border-gray-300 rounded-xl bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                                <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                                <AirportAutocomplete
                                  id={`multi-destination-${flight.id}`}
                                  label=""
                                  value={flight.destination}
                                  onChange={(value) => updateMultiCityFlight(flight.id, 'destination', value)}
                                  placeholder="City or airport"
                                  inline
                                />
                              </div>
                            </div>

                            {/* Date */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                Date
                              </label>
                              <AirlineDatePicker
                                startDate={flight.date}
                                endDate={undefined}
                                onStartDateChange={(date) => updateMultiCityFlight(flight.id, 'date', date)}
                                onEndDateChange={() => {}}
                                single={true}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Another Flight Button */}
                      <button
                        type="button"
                        onClick={addMultiCityFlight}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <span className="text-xl">+</span> Add another flight
                      </button>

                      {/* Search Button */}
                      <button
                        type="submit"
                        className="w-full h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg"
                      >
                        Search
                      </button>
                    </div>
                  ) : (
                    <>
                  {/* Desktop: Single row with swap overlap */}
                  <div className="hidden lg:flex items-end gap-2">
                    {/* Leaving From */}
                    <div className="flex-[1.7]">
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Leaving from
                      </label>
                      <div className="relative">
                        <div className="flex items-center h-12 border border-gray-300 rounded-xl bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                          <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                          <AirportAutocomplete
                            id="origin-home"
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

                    {/* Going To */}
                    <div className="flex-[1.7]">
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Going to
                      </label>
                      <div className="relative">
                        <div className="flex items-center h-12 border border-gray-300 rounded-xl bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                          <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                          <AirportAutocomplete
                            id="destination-home"
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

                  {/* Tablet/Mobile: Stacked vertical layout (4 rows like Expedia) */}
                  <div className="lg:hidden">
                    {/* Row 1: Leaving From */}
                    <div className="relative mb-2">
                      <div className="flex items-center h-14 border border-gray-300 rounded-lg bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 font-medium mb-0.5">Leaving from</div>
                          <AirportAutocomplete
                            id="origin-home-mobile"
                            label=""
                            value={origin}
                            onChange={setOrigin}
                            placeholder="City or airport"
                            inline
                          />
                        </div>
                      </div>
                      
                      {/* Swap Button - Vertically centered between fields, right aligned like Expedia */}
                      <div className="absolute bottom-0 right-3 translate-y-1/2 z-10">
                        <button
                          type="button"
                          onClick={handleSwap}
                          className="h-9 w-9 flex items-center justify-center border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-md"
                        >
                          <ArrowLeftRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Going To */}
                    <div className="relative mb-2">
                      <div className="flex items-center h-14 border border-gray-300 rounded-lg bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 font-medium mb-0.5">Going to</div>
                          <AirportAutocomplete
                            id="destination-home-mobile"
                            label=""
                            value={destination}
                            onChange={setDestination}
                            placeholder="City or airport"
                            inline
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Dates */}
                    <div className="mb-2">
                      <AirlineDatePicker
                        startDate={departureDate}
                        endDate={tripType === 'round-trip' ? returnDate : undefined}
                        onStartDateChange={setDepartureDate}
                        onEndDateChange={setReturnDate}
                        single={tripType === 'one-way'}
                        mobile
                      />
                    </div>

                    {/* Row 4: Travelers */}
                    <div className="mb-4">
                      <TravelersSelector value={travelers} onChange={setTravelers} mobile />
                    </div>

                    {/* Search Button - Full width on mobile */}
                    <button
                      type="submit"
                      className="w-full h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg"
                    >
                      Search
                    </button>
                  </div>
                  </>
                  )}

                  {/* Mobile Multi-city Layout */}
                  {tripType === 'multi-city' && (
                    <div className="lg:hidden space-y-4">
                      {/* Travelers - Shared across all flights */}
                      <div className="mb-4">
                        <TravelersSelector value={travelers} onChange={setTravelers} mobile />
                      </div>

                      {multiCityFlights.map((flight, index) => (
                        <div key={flight.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">Flight {index + 1}</h3>
                            {multiCityFlights.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeMultiCityFlight(flight.id)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {/* Leaving From */}
                          <div className="relative">
                            <div className="flex items-center h-14 border border-gray-300 rounded-lg bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                              <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-600 font-medium mb-0.5">Leaving from</div>
                                <AirportAutocomplete
                                  id={`multi-origin-mobile-${flight.id}`}
                                  label=""
                                  value={flight.origin}
                                  onChange={(value) => updateMultiCityFlight(flight.id, 'origin', value)}
                                  placeholder="City or airport"
                                  inline
                                />
                              </div>
                            </div>
                            
                            {/* Swap Button */}
                            <div className="absolute bottom-0 right-3 translate-y-1/2 z-10">
                              <button
                                type="button"
                                onClick={() => {
                                  const temp = flight.origin;
                                  updateMultiCityFlight(flight.id, 'origin', flight.destination);
                                  updateMultiCityFlight(flight.id, 'destination', temp);
                                }}
                                className="h-9 w-9 flex items-center justify-center border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-md"
                              >
                                <ArrowLeftRight className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          {/* Going To */}
                          <div className="relative">
                            <div className="flex items-center h-14 border border-gray-300 rounded-lg bg-white px-4 hover:border-gray-400 focus-within:border-blue-500 transition-colors">
                              <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-600 font-medium mb-0.5">Going to</div>
                                <AirportAutocomplete
                                  id={`multi-destination-mobile-${flight.id}`}
                                  label=""
                                  value={flight.destination}
                                  onChange={(value) => updateMultiCityFlight(flight.id, 'destination', value)}
                                  placeholder="City or airport"
                                  inline
                                />
                              </div>
                            </div>
                          </div>

                          {/* Date */}
                          <div>
                            <AirlineDatePicker
                              startDate={flight.date}
                              endDate={undefined}
                              onStartDateChange={(date) => updateMultiCityFlight(flight.id, 'date', date)}
                              onEndDateChange={() => {}}
                              single={true}
                              mobile
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add Another Flight Button */}
                      <button
                        type="button"
                        onClick={addMultiCityFlight}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <span className="text-xl">+</span> Add another flight
                      </button>

                      {/* Search Button - Full width on mobile */}
                      <button
                        type="submit"
                        className="w-full h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg"
                      >
                        Search
                      </button>
                    </div>
                  )}
                </div>
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
