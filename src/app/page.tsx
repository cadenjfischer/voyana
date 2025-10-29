'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-background-50">
      {/* Hero Section with Search */}
      <div 
        className="relative bg-gradient-to-r from-background-600 via-background-700 to-background-800 text-white"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background-900/80 via-background-800/70 to-background-900/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-3 sm:mb-4">
            Made to Travel
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-center text-static-text-900 dark:text-static-text-50 mb-8 sm:mb-10 lg:mb-12">
            Book flights, hotels, and more with Voyana
          </p>

          {/* Search Card */}
          <div className="bg-static-gray-50 dark:bg-static-bg-900 rounded-xl shadow-2xl p-4 sm:p-6 max-w-7xl mx-auto overflow-visible">
            {/* Tabs */}
            <div className="flex gap-4 sm:gap-6 mb-6 border-b border-static-primary-300 dark:border-static-primary-700 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('flights')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'flights' ? 'text-accent-600' : 'text-static-text-600 dark:text-static-text-static-text-900 dark:text-static-text-50 hover:text-accent-600'
                }`}
              >
                <Plane className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Flights</span>
                {activeTab === 'flights' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('stays')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'stays' ? 'text-accent-600' : 'text-static-text-600 dark:text-static-text-static-text-900 dark:text-static-text-50 hover:text-accent-300'
                }`}
                disabled
              >
                <Bed className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Stays</span>
                <span className="text-xs bg-static-primary-200 dark:bg-static-primary-700 text-static-primary-700 dark:text-static-primary-100 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('cars')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'cars' ? 'text-accent-600' : 'text-static-text-600 dark:text-static-text-static-text-900 dark:text-static-text-50 hover:text-accent-300'
                }`}
                disabled
              >
                <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Cars</span>
                <span className="text-xs bg-static-primary-200 dark:bg-static-primary-700 text-static-primary-700 dark:text-static-primary-100 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('packages')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'packages' ? 'text-accent-600' : 'text-static-text-600 dark:text-static-text-static-text-900 dark:text-static-text-50 hover:text-accent-300'
                }`}
                disabled
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Packages</span>
                <span className="text-xs bg-static-primary-200 dark:bg-static-primary-700 text-static-primary-700 dark:text-static-primary-100 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('things')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'things' ? 'text-accent-600' : 'text-static-text-600 dark:text-static-text-static-text-900 dark:text-static-text-50 hover:text-accent-300'
                }`}
                disabled
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Things to do</span>
                <span className="text-xs bg-static-primary-200 dark:bg-static-primary-700 text-static-primary-700 dark:text-static-primary-300 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                onClick={() => setActiveTab('cruises')}
                className={`flex items-center gap-2 pb-4 px-2 font-semibold transition-all relative ${
                  activeTab === 'cruises' ? 'text-accent-600' : 'text-static-text-600 dark:text-static-text-static-text-900 dark:text-static-text-50 hover:text-accent-300'
                }`}
                disabled
              >
                <Ship className="w-5 h-5" />
                <span>Cruises</span>
                <span className="text-xs bg-static-primary-200 dark:bg-static-primary-700 text-static-primary-700 dark:text-static-primary-100 px-2 py-0.5 rounded">Soon</span>
              </button>
            </div>

            {/* Flight Search Form */}
            {activeTab === 'flights' && (
              <form onSubmit={handleFlightSearch} className="space-y-4">
                {/* Top Controls Bar - Google Flights Style */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Trip Type Dropdown */}
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as any)}
                    className="h-10 px-3 pr-8 border-0 rounded-md bg-transparent text-static-text-900 dark:text-static-text-50 text-sm font-medium hover:bg-static-bg-50 dark:hover:bg-static-bg-800 focus:outline-none focus:ring-0 transition-colors cursor-pointer"
                  >
                    <option value="round-trip">Round-trip</option>
                    <option value="one-way">One-way</option>
                    <option value="multi-city">Multi-city</option>
                  </select>

                  {/* Travelers Selector - Compact inline version */}
                  <div className="[&>div>button]:h-10 [&>div>button]:rounded-md [&>div>button]:px-3 [&>div>button]:min-w-0 [&>div>button]:border-0 [&>div>button]:bg-transparent [&>div>button]:hover:bg-static-bg-50 dark:[&>div>button]:hover:bg-static-bg-800">
                    <TravelersSelector value={travelers} onChange={setTravelers} />
                  </div>
                </div>

                {/* Search Fields - Responsive Layout */}
                <div className="space-y-4">
                  {/* Multi-city mode */}
                  {tripType === 'multi-city' ? (
                    <div className="space-y-4">

                      {multiCityFlights.map((flight, index) => (
                        <div key={flight.id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-static-text-900 dark:text-static-text-50">Flight {index + 1}</h3>
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
                          
                          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.5fr] gap-2 items-end">
                            {/* Leaving From */}
                            <div className="relative">
                              <label className="block text-xs font-semibold text-static-text-900 dark:text-static-text-50 mb-2 uppercase tracking-wide">
                                Leaving from
                              </label>
                              <div className="flex items-center h-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent dark:bg-transparent px-4 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                                <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-3" />
                                <AirportAutocomplete
                                  id={`multi-origin-${flight.id}`}
                                  label=""
                                  value={flight.origin}
                                  onChange={(value) => updateMultiCityFlight(flight.id, 'origin', value)}
                                  placeholder="City or airport"
                                  inline
                                />
                              </div>
                              
                              {/* Swap Button - Google Flights Style */}
                              <button
                                type="button"
                                onClick={() => {
                                  const temp = flight.origin;
                                  updateMultiCityFlight(flight.id, 'origin', flight.destination);
                                  updateMultiCityFlight(flight.id, 'destination', temp);
                                }}
                                className="absolute -right-5 bottom-1 h-10 w-10 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-full bg-background-50 dark:bg-background-900 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-md hover:shadow-lg flex-shrink-0 z-20"
                              >
                                <ArrowLeftRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                              </button>
                            </div>

                            {/* Going To */}
                            <div>
                              <label className="block text-xs font-semibold text-static-text-900 dark:text-static-text-50 mb-2 uppercase tracking-wide">
                                Going to
                              </label>
                              <div className="flex items-center h-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent dark:bg-transparent px-4 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                                <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-3" />
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
                              <label className="block text-xs font-semibold text-static-text-900 dark:text-static-text-50 mb-2 uppercase tracking-wide">
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
                        className="flex items-center gap-2 text-primary-600 hover:text-static-text-900 dark:text-static-text-50 font-medium text-sm"
                      >
                        <span className="text-xl">+</span> Add another flight
                      </button>

                      {/* Search Button */}
                      <button
                        type="submit"
                        className="btn btn-primary btn-md btn-full"
                        style={{ height: '3rem' }}
                      >
                        Search
                      </button>
                    </div>
                  ) : (
                    <>
                  {/* Desktop: Single row with swap overlap - Google Flights Style */}
                  <div className="hidden lg:flex items-center gap-2">
                    {/* Leaving From */}
                    <div className="flex-1">
                      <div className="relative">
                        <div className="flex items-center h-14 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent dark:bg-transparent px-4 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                          <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
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
                      className="-mx-6 h-10 w-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-full bg-static-bg-900 hover:bg-static-bg-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm flex-shrink-0 z-20"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Going To */}
                    <div className="flex-1">
                      <div className="relative">
                        <div className="flex items-center h-14 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent dark:bg-transparent px-4 hover:border-gray-400 dark:hover:border-gray-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                          <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
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
                    <div className="flex-1">
                      <AirlineDatePicker
                        startDate={departureDate}
                        endDate={tripType === 'round-trip' ? returnDate : undefined}
                        onStartDateChange={setDepartureDate}
                        onEndDateChange={setReturnDate}
                        single={tripType === 'one-way'}
                      />
                    </div>

                    {/* Search Button */}
                    <button
                      type="submit"
                      className="btn btn-primary btn-md h-14 px-8 flex-shrink-0"
                    >
                      Search
                    </button>
                  </div>

                  {/* Tablet/Mobile: Stacked vertical layout (4 rows like Expedia) */}
                  <div className="lg:hidden">
                    {/* Row 1: Leaving From */}
                    <div className="relative mb-2">
                      <div className="flex items-center h-14 border border-primary-300 rounded-lg bg-transparent dark:bg-transparent px-4 hover:border-primary-400 focus-within:border-primary-500 transition-colors">
                        <MapPin className="w-5 h-5 text-primary-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-primary-600 font-medium mb-0.5">Leaving from</div>
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
                      
                      {/* Swap Button - Google Flights Style */}
                      <div className="absolute bottom-0 right-3 translate-y-1/2 z-10">
                        <button
                          type="button"
                          onClick={handleSwap}
                          className="h-9 w-9 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-full bg-background-50 dark:bg-background-900 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-md hover:shadow-lg"
                        >
                          <ArrowLeftRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Going To */}
                    <div className="relative mb-2">
                      <div className="flex items-center h-14 border border-primary-300 rounded-lg bg-transparent dark:bg-transparent px-4 hover:border-primary-400 focus-within:border-primary-500 transition-colors">
                        <MapPin className="w-5 h-5 text-primary-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-primary-600 font-medium mb-0.5">Going to</div>
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
                      className="btn btn-primary btn-md btn-full"
                      style={{ height: '3rem' }}
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
                            <h3 className="text-sm font-semibold text-static-text-900 dark:text-static-text-50">Flight {index + 1}</h3>
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
                            <div className="flex items-center h-14 border border-primary-300 rounded-lg bg-transparent dark:bg-transparent px-4 hover:border-primary-400 focus-within:border-primary-500 transition-colors">
                              <MapPin className="w-5 h-5 text-primary-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-primary-600 font-medium mb-0.5">Leaving from</div>
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
                                className="h-9 w-9 flex items-center justify-center border border-primary-300 rounded-full bg-transparent dark:bg-transparent hover:bg-transparent dark:bg-transparent transition-colors shadow-md"
                              >
                                <ArrowLeftRight className="w-4 h-4 text-primary-600" />
                              </button>
                            </div>
                          </div>

                          {/* Going To */}
                          <div className="relative">
                            <div className="flex items-center h-14 border border-primary-300 rounded-lg bg-transparent dark:bg-transparent px-4 hover:border-primary-400 focus-within:border-primary-500 transition-colors">
                              <MapPin className="w-5 h-5 text-primary-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-primary-600 font-medium mb-0.5">Going to</div>
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
                        className="flex items-center gap-2 text-primary-600 hover:text-static-text-900 dark:text-static-text-50 font-medium text-sm"
                      >
                        <span className="text-xl">+</span> Add another flight
                      </button>

                      {/* Search Button - Full width on mobile */}
                      <button
                        type="submit"
                        className="btn btn-primary btn-md btn-full"
                        style={{ height: '3rem' }}
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
      <section className="py-16 bg-static-bg-100 dark:bg-static-bg-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Plane className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">Best Prices</h3>
              <p className="text-primary-600">
                Compare flights from multiple airlines to find the best deals
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Package className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">All-in-One</h3>
              <p className="text-primary-600">
                Book flights, hotels, cars, and activities in one place
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">Travel Planning</h3>
              <p className="text-primary-600">
                Plan your entire trip with our comprehensive itinerary tools
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
