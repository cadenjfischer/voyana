'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { Plane, ArrowRight, Filter, X, Wifi, Zap, Monitor, Utensils, Luggage } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import PassengerInfoModal, { PassengerInfo } from './PassengerInfoModal';
import FareClassModal from './FareClassModal';
import BookingSuccessModal from './BookingSuccessModal';

interface FlightResultsProps {
  flights: NormalizedFlight[];
  onFlightBooked?: () => void;
  passengerCount?: number;
}

type SortOption = 'best' | 'cheapest' | 'fastest';

export default function FlightResults({ 
  flights, 
  onFlightBooked,
  passengerCount = 1 
}: FlightResultsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  const [bookingFlight, setBookingFlight] = useState<string | null>(null);
  const [fareModalOpen, setFareModalOpen] = useState(false);
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [bookingReference, setBookingReference] = useState<string>('');
  const [selectedFlight, setSelectedFlight] = useState<NormalizedFlight | null>(null);
  const [selectedFareClass, setSelectedFareClass] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>('best');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    nonstopOnly: false,
    maxPrice: Infinity,
    airlines: [] as string[],
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBookClick = (flight: NormalizedFlight) => {
    if (!user) {
      alert('Please sign in to book flights');
      return;
    }
    setSelectedFlight(flight);
    setFareModalOpen(true);
  };

  const handleFareSelect = (fareClass: any) => {
    setSelectedFareClass(fareClass);
    setFareModalOpen(false);
    setPassengerModalOpen(true);
  };

  const handleConfirmBooking = async (passengers: PassengerInfo[]) => {
    if (!selectedFlight || !user || !selectedFareClass) return;

    setPassengerModalOpen(false);
    setBookingFlight(selectedFlight.id);

    try {
      // Transform passengers to the format expected by the APIs
      const formattedPassengers = passengers.map(p => ({
        type: 'adult',
        title: p.title,
        given_name: p.givenName,
        family_name: p.familyName,
        born_on: p.dateOfBirth,
        email: p.email,
        phone_number: p.phoneNumber,
        gender: p.gender,
      }));

      const response = await fetch('/api/flights/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight: selectedFlight,
          userId: user.id,
          passengers: formattedPassengers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBookingReference(data.bookingReference);
        setSuccessModalOpen(true);
        onFlightBooked?.();
      } else {
        alert(`Booking failed: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book flight. Please try again.');
    } finally {
      setBookingFlight(null);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
    setSelectedFlight(null);
    setSelectedFareClass(null);
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(\d+)?M?/);
    if (!match) return duration;
    const hours = match[1];
    const minutes = match[2] || '00';
    return `${hours}h ${minutes}m`;
  };

  // Get unique airlines for filter
  const availableAirlines = useMemo(() => {
    const airlines = new Set(flights.map(f => f.carrier));
    return Array.from(airlines).sort();
  }, [flights]);

  // Filter and sort flights
  const processedFlights = useMemo(() => {
    let filtered = [...flights];

    // Apply filters
    if (filters.nonstopOnly) {
      filtered = filtered.filter(f => f.stops === 0);
    }
    if (filters.maxPrice !== Infinity) {
      filtered = filtered.filter(f => f.price <= filters.maxPrice);
    }
    if (filters.airlines.length > 0) {
      filtered = filtered.filter(f => filters.airlines.includes(f.carrier));
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'cheapest') {
        return a.price - b.price;
      } else if (sortBy === 'fastest') {
        const durationA = parseInt(a.duration.match(/PT(\d+)H/)?.[1] || '999');
        const durationB = parseInt(b.duration.match(/PT(\d+)H/)?.[1] || '999');
        return durationA - durationB;
      } else {
        // 'best' - balance of price and duration
        const scoreA = a.price + (parseInt(a.duration.match(/PT(\d+)H/)?.[1] || '999') * 10);
        const scoreB = b.price + (parseInt(b.duration.match(/PT(\d+)H/)?.[1] || '999') * 10);
        return scoreA - scoreB;
      }
    });

    return filtered;
  }, [flights, filters, sortBy]);

  const toggleAirlineFilter = (airline: string) => {
    setFilters(prev => ({
      ...prev,
      airlines: prev.airlines.includes(airline)
        ? prev.airlines.filter(a => a !== airline)
        : [...prev.airlines, airline]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
      {/* Sort and Filter Bar - Compact */}
      <div className="bg-static-bg-50 dark:bg-gray-900 rounded-lg shadow-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sort Tabs */}
          <button
            onClick={() => setSortBy('best')}
            className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-all ${
              sortBy === 'best'
                ? 'bg-static-accent-600 text-white shadow-sm'
                : 'text-static-text-600 dark:text-static-text-400 hover:bg-static-bg-100 dark:hover:bg-static-bg-700'
            }`}
          >
            Best
          </button>
          <button
            onClick={() => setSortBy('cheapest')}
            className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-all ${
              sortBy === 'cheapest'
                ? 'bg-static-accent-600 text-white shadow-sm'
                : 'text-static-text-600 dark:text-static-text-400 hover:bg-static-bg-100 dark:hover:bg-static-bg-700'
            }`}
          >
            Cheapest
          </button>
          <button
            onClick={() => setSortBy('fastest')}
            className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-all ${
              sortBy === 'fastest'
                ? 'bg-static-accent-600 text-white shadow-sm'
                : 'text-static-text-600 dark:text-static-text-400 hover:bg-static-bg-100 dark:hover:bg-static-bg-700'
            }`}
          >
            Fastest
          </button>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-static-bg-300 dark:border-static-bg-600 hover:border-static-accent-500 transition-colors font-medium text-sm text-static-text-700 dark:text-static-text-300"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {(filters.nonstopOnly || filters.airlines.length > 0) && (
            <span className="ml-1 px-1.5 py-0.5 bg-static-accent-600 text-white text-xs rounded-full">
              {filters.nonstopOnly ? 1 : 0 + filters.airlines.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel - Compact */}
      {showFilters && (
        <div className="bg-static-bg-50 dark:bg-gray-900 rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-static-text-900 dark:text-static-text-100">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-static-bg-100 dark:hover:bg-static-bg-700 rounded transition-colors"
            >
              <X className="h-4 w-4 text-static-text-500 dark:text-static-text-400" />
            </button>
          </div>

          {/* Stops Filter */}
          <div>
            <h4 className="font-semibold text-sm text-static-text-900 dark:text-static-text-100 mb-2">Stops</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.nonstopOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, nonstopOnly: e.target.checked }))}
                className="w-4 h-4 text-static-accent-600 rounded focus:ring-2 focus:ring-static-accent-500"
              />
              <span className="text-sm text-static-text-700 dark:text-static-text-300">Nonstop only</span>
            </label>
          </div>

          {/* Airlines Filter */}
          {availableAirlines.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-static-text-900 dark:text-static-text-100 mb-2">Airlines</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {availableAirlines.map(airline => (
                  <label key={airline} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.airlines.includes(airline)}
                      onChange={() => toggleAirlineFilter(airline)}
                      className="w-4 h-4 text-static-accent-600 rounded focus:ring-2 focus:ring-static-accent-500"
                    />
                    <span className="text-sm text-static-text-700 dark:text-static-text-300">{airline}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          <button
            onClick={() => setFilters({ nonstopOnly: false, maxPrice: Infinity, airlines: [] })}
            className="w-full py-1.5 text-sm text-static-accent-600 dark:text-static-accent-400 hover:bg-static-accent-50 dark:hover:bg-static-accent-900/20 rounded font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-static-text-600 dark:text-static-text-400">
          Showing <span className="font-semibold text-static-text-900 dark:text-static-text-100">{processedFlights.length}</span> of{' '}
          <span className="font-semibold text-static-text-900 dark:text-static-text-100">{flights.length}</span> flights
        </p>
      </div>

      {/* Flight Cards - Ultra Compact */}
      {processedFlights.map((flight) => (
        <div
          key={flight.id}
          className="bg-static-bg-50 dark:bg-gray-900 border border-static-bg-200 dark:border-gray-700 rounded-lg p-4 hover:border-static-accent-300 dark:hover:border-static-accent-600 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            {/* Left: Flight Info */}
            <div className="flex-1">
              {/* Airline Header - Compact */}
              <div className="flex items-center gap-2 mb-3">
                {flight.carrierLogo ? (
                  <img
                    src={flight.carrierLogo}
                    alt={flight.carrier}
                    className="h-6 w-auto object-contain"
                  />
                ) : (
                  <div className="h-6 w-6 rounded bg-static-accent-100 dark:bg-static-accent-900/20 flex items-center justify-center">
                    <Plane className="h-4 w-4 text-static-accent-600 dark:text-static-accent-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-static-text-900 dark:text-static-text-100 text-sm">{flight.carrier}</p>
                  <p className="text-xs text-static-text-500 dark:text-static-text-400">{flight.flightNumber}</p>
                </div>
              </div>

              {/* Route Timeline - Compact */}
              <div className="flex items-center gap-4">
                {/* Departure */}
                <div className="w-20 text-left">
                  <p className="text-2xl font-bold text-static-text-900 dark:text-static-text-100">
                    {format(new Date(flight.departure), 'HH:mm')}
                  </p>
                  <p className="text-xs font-semibold text-static-text-700 dark:text-static-text-300 mt-0.5">{flight.origin}</p>
                </div>

                {/* Duration Line - Compact */}
                <div className="flex-1 flex flex-col items-center px-2">
                  <p className="text-xs text-static-text-600 dark:text-static-text-400 font-medium mb-1">
                    {formatDuration(flight.duration)}
                  </p>
                  <div className="w-full relative">
                    <div className="h-0.5 bg-static-bg-300 dark:bg-static-bg-600 w-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-static-bg-50 dark:bg-gray-900 px-1">
                      <Plane className="h-3 w-3 text-static-text-400 dark:text-static-text-500 transform rotate-90" />
                    </div>
                  </div>
                  <p className="text-xs text-static-text-500 dark:text-static-text-400 font-medium mt-1">
                    {flight.stops === 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">Nonstop</span>
                    ) : (
                      `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`
                    )}
                  </p>
                </div>

                {/* Arrival */}
                <div className="w-20 text-right">
                  <p className="text-2xl font-bold text-static-text-900 dark:text-static-text-100">
                    {format(new Date(flight.arrival), 'HH:mm')}
                  </p>
                  <p className="text-xs font-semibold text-static-text-700 dark:text-static-text-300 mt-0.5">{flight.destination}</p>
                </div>
              </div>

              {/* Badges - Compact */}
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="px-2 py-0.5 bg-static-accent-50 dark:bg-static-accent-900/20 text-static-accent-700 dark:text-static-accent-300 text-xs font-semibold rounded">
                  {flight.cabinClass}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  flight.apiSource === 'duffel'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                }`}>
                  Duffel
                </span>
                
                {/* Amenities Icons */}
                {flight.amenities && (
                  <div className="flex items-center gap-1.5 ml-1">
                    {flight.amenities.wifi && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded" title="Wi-Fi available">
                        <Wifi className="h-3 w-3" />
                      </div>
                    )}
                    {flight.amenities.power && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded" title="Power outlet">
                        <Zap className="h-3 w-3" />
                      </div>
                    )}
                    {flight.amenities.entertainment && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded" title="Entertainment system">
                        <Monitor className="h-3 w-3" />
                      </div>
                    )}
                    {flight.amenities.meals && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded" title="Meals included">
                        <Utensils className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Baggage Info */}
                {flight.baggage && (
                  <div className="flex items-center gap-1 text-xs text-static-text-600 dark:text-static-text-400">
                    <Luggage className="h-3 w-3" />
                    <span>
                      {flight.baggage.carryOn?.quantity || 0} carry-on
                      {flight.baggage.checked && flight.baggage.checked.quantity > 0 && (
                        <>, {flight.baggage.checked.quantity} checked</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Price and Book - Compact */}
            <div className="ml-6 flex flex-col items-end">
              <div className="text-right mb-2">
                <p className="text-2xl font-bold text-static-accent-600 dark:text-static-accent-400">
                  {flight.currency === 'USD' ? '$' : flight.currency}
                  {flight.price.toFixed(0)}
                </p>
                <p className="text-xs text-static-text-500 dark:text-static-text-400 font-medium">per person</p>
              </div>

              <button
                onClick={() => handleBookClick(flight)}
                disabled={bookingFlight === flight.id}
                className="px-6 py-2 bg-gradient-to-r from-static-accent-600 to-static-accent-700 text-white font-bold rounded-lg hover:from-static-accent-700 hover:to-static-accent-800 focus:outline-none focus:ring-2 focus:ring-static-accent-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
              >
                {bookingFlight === flight.id ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Booking...
                  </span>
                ) : (
                  'Book Now'
                )}
              </button>

              <button
                onClick={() => setExpandedFlight(expandedFlight === flight.id ? null : flight.id)}
                className="mt-2 text-xs text-static-accent-600 dark:text-static-accent-400 hover:text-static-accent-700 dark:hover:text-static-accent-300 font-semibold flex items-center gap-0.5"
              >
                {expandedFlight === flight.id ? 'Hide' : 'Details'}
                <ArrowRight className={`h-3 w-3 transition-transform ${expandedFlight === flight.id ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expanded Details - Compact */}
          {expandedFlight === flight.id && (
            <div className="mt-4 pt-4 border-t border-static-bg-100 dark:border-static-bg-700 space-y-4">
              {/* Flight Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold text-static-text-500 dark:text-static-text-400 uppercase tracking-wide mb-1">Departure Date</p>
                  <p className="font-semibold text-sm text-static-text-900 dark:text-static-text-100">
                    {format(new Date(flight.departure), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-static-text-500 dark:text-static-text-400 uppercase tracking-wide mb-1">Arrival Date</p>
                  <p className="font-semibold text-sm text-static-text-900 dark:text-static-text-100">
                    {format(new Date(flight.arrival), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-static-text-500 dark:text-static-text-400 uppercase tracking-wide mb-1">Duration</p>
                  <p className="font-semibold text-sm text-static-text-900 dark:text-static-text-100">{formatDuration(flight.duration)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-static-text-500 dark:text-static-text-400 uppercase tracking-wide mb-1">Class</p>
                  <p className="font-semibold text-sm text-static-text-900 dark:text-static-text-100 capitalize">{flight.cabinClass}</p>
                </div>
              </div>

              {/* Amenities Section */}
              {flight.amenities && (Object.values(flight.amenities).some(v => v)) && (
                <div>
                  <p className="text-xs font-semibold text-static-text-500 dark:text-static-text-400 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {flight.amenities.wifi && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
                        <Wifi className="h-4 w-4" />
                        <span className="font-medium">Wi-Fi</span>
                      </div>
                    )}
                    {flight.amenities.power && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">Power outlet</span>
                      </div>
                    )}
                    {flight.amenities.entertainment && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-sm">
                        <Monitor className="h-4 w-4" />
                        <span className="font-medium">Entertainment</span>
                      </div>
                    )}
                    {flight.amenities.meals && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 rounded-lg text-sm">
                        <Utensils className="h-4 w-4" />
                        <span className="font-medium">Meals included</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Baggage Section */}
              {flight.baggage && (
                <div>
                  <p className="text-xs font-semibold text-static-text-500 dark:text-static-text-400 uppercase tracking-wide mb-2">Baggage Allowance</p>
                  <div className="flex flex-wrap gap-3">
                    {flight.baggage.carryOn && flight.baggage.carryOn.quantity > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-static-accent-50 dark:bg-static-accent-900/20 border border-static-accent-200 dark:border-static-accent-800 rounded-lg">
                        <Luggage className="h-4 w-4 text-static-accent-600 dark:text-static-accent-400" />
                        <div>
                          <p className="text-sm font-semibold text-static-accent-900 dark:text-static-accent-100">
                            {flight.baggage.carryOn.quantity}x Carry-on
                          </p>
                          {flight.baggage.carryOn.weight && (
                            <p className="text-xs text-static-accent-700 dark:text-static-accent-300">Up to {flight.baggage.carryOn.weight}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {flight.baggage.checked && flight.baggage.checked.quantity > 0 ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <Luggage className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                            {flight.baggage.checked.quantity}x Checked bag{flight.baggage.checked.quantity > 1 ? 's' : ''}
                          </p>
                          {flight.baggage.checked.weight && (
                            <p className="text-xs text-green-700 dark:text-green-300">Up to {flight.baggage.checked.weight} each</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-static-bg-100 dark:bg-gray-950 border border-static-bg-200 dark:border-gray-700 rounded-lg">
                        <Luggage className="h-5 w-5 text-static-text-400 dark:text-static-text-500" />
                        <div>
                          <p className="text-sm font-semibold text-static-text-700 dark:text-static-text-300">No checked bags included</p>
                          <p className="text-xs text-static-text-500 dark:text-static-text-400">May be available for purchase</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {processedFlights.length === 0 && (
        <div className="bg-static-bg-50 dark:bg-gray-900 border-2 border-dashed border-static-bg-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <Plane className="h-12 w-12 text-static-text-400 dark:text-static-text-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-static-text-900 dark:text-static-text-100 mb-1">No flights found</h3>
          <p className="text-sm text-static-text-600 dark:text-static-text-400">Try adjusting your filters to see more results</p>
        </div>
      )}

      {/* Fare Class Selection Modal */}
      {selectedFlight && (
        <FareClassModal
          isOpen={fareModalOpen}
          onClose={() => {
            setFareModalOpen(false);
            setSelectedFlight(null);
          }}
          flight={selectedFlight}
          onSelectFare={handleFareSelect}
        />
      )}

      {/* Passenger Information Modal */}
      {selectedFlight && (
        <PassengerInfoModal
          isOpen={passengerModalOpen}
          onClose={() => {
            setPassengerModalOpen(false);
            setSelectedFlight(null);
            setSelectedFareClass(null);
          }}
          flight={selectedFlight}
          passengerCount={passengerCount}
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* Booking Success Modal */}
      {selectedFlight && (
        <BookingSuccessModal
          isOpen={successModalOpen}
          onClose={handleCloseSuccessModal}
          bookingReference={bookingReference}
          flight={selectedFlight}
        />
      )}
    </div>
  );
}
