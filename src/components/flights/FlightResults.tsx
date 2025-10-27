'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { Plane, ArrowRight, Filter, X, Wifi, Zap, Monitor, Utensils, Luggage } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import PassengerInfoModal, { PassengerInfo } from './PassengerInfoModal';
import FareClassModal from './FareClassModal';

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
        alert(`Flight booked successfully! Reference: ${data.bookingReference}`);
        onFlightBooked?.();
      } else {
        alert(`Booking failed: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book flight. Please try again.');
    } finally {
      setBookingFlight(null);
      setSelectedFlight(null);
    }
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
    <div className="space-y-4">
      {/* Sort and Filter Bar - Compact */}
      <div className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sort Tabs */}
          <button
            onClick={() => setSortBy('best')}
            className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-all ${
              sortBy === 'best'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Best
          </button>
          <button
            onClick={() => setSortBy('cheapest')}
            className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-all ${
              sortBy === 'cheapest'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cheapest
          </button>
          <button
            onClick={() => setSortBy('fastest')}
            className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-all ${
              sortBy === 'fastest'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Fastest
          </button>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 hover:border-blue-500 transition-colors font-medium text-sm text-gray-700"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {(filters.nonstopOnly || filters.airlines.length > 0) && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {filters.nonstopOnly ? 1 : 0 + filters.airlines.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel - Compact */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Stops Filter */}
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Stops</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.nonstopOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, nonstopOnly: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Nonstop only</span>
            </label>
          </div>

          {/* Airlines Filter */}
          {availableAirlines.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Airlines</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {availableAirlines.map(airline => (
                  <label key={airline} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.airlines.includes(airline)}
                      onChange={() => toggleAirlineFilter(airline)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{airline}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          <button
            onClick={() => setFilters({ nonstopOnly: false, maxPrice: Infinity, airlines: [] })}
            className="w-full py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-600">
          Showing <span className="font-semibold text-gray-900">{processedFlights.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{flights.length}</span> flights
        </p>
      </div>

      {/* Flight Cards - Ultra Compact */}
      {processedFlights.map((flight) => (
        <div
          key={flight.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
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
                  <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center">
                    <Plane className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{flight.carrier}</p>
                  <p className="text-xs text-gray-500">{flight.flightNumber}</p>
                </div>
              </div>

              {/* Route Timeline - Compact */}
              <div className="flex items-center gap-4">
                {/* Departure */}
                <div className="w-20 text-left">
                  <p className="text-2xl font-bold text-gray-900">
                    {format(new Date(flight.departure), 'HH:mm')}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">{flight.origin}</p>
                </div>

                {/* Duration Line - Compact */}
                <div className="flex-1 flex flex-col items-center px-2">
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    {formatDuration(flight.duration)}
                  </p>
                  <div className="w-full relative">
                    <div className="h-0.5 bg-gray-300 w-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                      <Plane className="h-3 w-3 text-gray-400 transform rotate-90" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {flight.stops === 0 ? (
                      <span className="text-green-600 font-semibold">Nonstop</span>
                    ) : (
                      `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`
                    )}
                  </p>
                </div>

                {/* Arrival */}
                <div className="w-20 text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {format(new Date(flight.arrival), 'HH:mm')}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">{flight.destination}</p>
                </div>
              </div>

              {/* Badges - Compact */}
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  {flight.cabinClass}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  flight.apiSource === 'duffel'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-orange-50 text-orange-700'
                }`}>
                  {flight.apiSource === 'duffel' ? 'Duffel' : 'Amadeus'}
                </span>
                
                {/* Amenities Icons */}
                {flight.amenities && (
                  <div className="flex items-center gap-1.5 ml-1">
                    {flight.amenities.wifi && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded" title="Wi-Fi available">
                        <Wifi className="h-3 w-3" />
                      </div>
                    )}
                    {flight.amenities.power && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded" title="Power outlet">
                        <Zap className="h-3 w-3" />
                      </div>
                    )}
                    {flight.amenities.entertainment && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded" title="Entertainment system">
                        <Monitor className="h-3 w-3" />
                      </div>
                    )}
                    {flight.amenities.meals && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded" title="Meals included">
                        <Utensils className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Baggage Info */}
                {flight.baggage && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
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
                <p className="text-2xl font-bold text-blue-600">
                  {flight.currency === 'USD' ? '$' : flight.currency}
                  {flight.price.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 font-medium">per person</p>
              </div>

              <button
                onClick={() => handleBookClick(flight)}
                disabled={bookingFlight === flight.id}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
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
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
              >
                {expandedFlight === flight.id ? 'Hide' : 'Details'}
                <ArrowRight className={`h-3 w-3 transition-transform ${expandedFlight === flight.id ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expanded Details - Compact */}
          {expandedFlight === flight.id && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              {/* Flight Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Departure Date</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {format(new Date(flight.departure), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Arrival Date</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {format(new Date(flight.arrival), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                  <p className="font-semibold text-sm text-gray-900">{formatDuration(flight.duration)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Class</p>
                  <p className="font-semibold text-sm text-gray-900 capitalize">{flight.cabinClass}</p>
                </div>
              </div>

              {/* Amenities Section */}
              {flight.amenities && (Object.values(flight.amenities).some(v => v)) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {flight.amenities.wifi && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        <Wifi className="h-4 w-4" />
                        <span className="font-medium">Wi-Fi</span>
                      </div>
                    )}
                    {flight.amenities.power && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">Power outlet</span>
                      </div>
                    )}
                    {flight.amenities.entertainment && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm">
                        <Monitor className="h-4 w-4" />
                        <span className="font-medium">Entertainment</span>
                      </div>
                    )}
                    {flight.amenities.meals && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm">
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
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Baggage Allowance</p>
                  <div className="flex flex-wrap gap-3">
                    {flight.baggage.carryOn && flight.baggage.carryOn.quantity > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <Luggage className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            {flight.baggage.carryOn.quantity}x Carry-on
                          </p>
                          {flight.baggage.carryOn.weight && (
                            <p className="text-xs text-blue-700">Up to {flight.baggage.carryOn.weight}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {flight.baggage.checked && flight.baggage.checked.quantity > 0 ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <Luggage className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">
                            {flight.baggage.checked.quantity}x Checked bag{flight.baggage.checked.quantity > 1 ? 's' : ''}
                          </p>
                          {flight.baggage.checked.weight && (
                            <p className="text-xs text-green-700">Up to {flight.baggage.checked.weight} each</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <Luggage className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">No checked bags included</p>
                          <p className="text-xs text-gray-500">May be available for purchase</p>
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
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No flights found</h3>
          <p className="text-sm text-gray-600">Try adjusting your filters to see more results</p>
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
    </div>
  );
}
