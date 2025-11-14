import { X, Check, Ban, Wifi, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import { NormalizedFlight } from '@/lib/api/duffelClient';
import { useState, useEffect, useRef } from 'react';

interface FareOption {
  name: string; // Airline-specific name (e.g., "Main Cabin", "Basic Economy")
  price: number;
  currency: string;
  offerId?: string; // The actual Duffel offer ID for booking
  features: {
    seatSelection: 'included' | 'free' | 'fee';
    carryOn: number;
    checked: number;
    changes: 'included' | 'fee' | 'not-allowed';
    refund: 'included' | 'fee' | 'not-allowed';
    meals?: boolean;
    wifi?: boolean;
    priority?: boolean;
  };
}

interface CabinClass {
  cabin: 'Economy' | 'Premium Economy' | 'Business';
  options: FareOption[];
}

interface FareClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: NormalizedFlight;
  onSelectFare: (fareOption: FareOption, cabin: string) => void;
}

export default function FareClassModal({
  isOpen,
  onClose,
  flight,
  onSelectFare,
}: FareClassModalProps) {
  const [selectedCabin, setSelectedCabin] = useState<'Economy' | 'Premium Economy' | 'Business'>('Economy');
  const [selectedFare, setSelectedFare] = useState<FareOption | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Use REAL fare options from API instead of fake data
  const allFareOptions = flight.fareOptions || [flight];
  
  // Group by cabin class (normalized to lowercase)
  const groupedByCabin: Record<string, NormalizedFlight[]> = {};
  allFareOptions.forEach((offer) => {
    const cabin = (offer.cabinClass || 'economy').toLowerCase().trim();
    if (!groupedByCabin[cabin]) {
      groupedByCabin[cabin] = [];
    }
    groupedByCabin[cabin].push(offer);
  });

  // Map to cabin class structure
  const cabinClasses: CabinClass[] = [];
  
  // Economy options
  if (groupedByCabin['economy']) {
    cabinClasses.push({
      cabin: 'Economy',
      options: groupedByCabin['economy'].map((offer) => ({
        name: `Economy - $${Math.round(offer.price)}`,
        price: offer.price,
        currency: offer.currency,
        offerId: offer.id,
        features: {
          seatSelection: 'fee',
          carryOn: offer.baggage?.carryOn?.quantity || 1,
          checked: offer.baggage?.checked?.quantity || 0,
          changes: 'fee',
          refund: 'not-allowed',
          meals: offer.amenities?.meals || false,
          wifi: offer.amenities?.wifi || false,
        },
      })),
    });
  }

  // Premium Economy options
  if (groupedByCabin['premium_economy']) {
    cabinClasses.push({
      cabin: 'Premium Economy',
      options: groupedByCabin['premium_economy'].map((offer) => ({
        name: `Premium Economy - $${Math.round(offer.price)}`,
        price: offer.price,
        currency: offer.currency,
        offerId: offer.id,
        features: {
          seatSelection: 'included',
          carryOn: offer.baggage?.carryOn?.quantity || 2,
          checked: offer.baggage?.checked?.quantity || 1,
          changes: 'included',
          refund: 'fee',
          meals: offer.amenities?.meals || true,
          wifi: offer.amenities?.wifi || true,
          priority: true,
        },
      })),
    });
  }

  // Business class options
  if (groupedByCabin['business']) {
    cabinClasses.push({
      cabin: 'Business',
      options: groupedByCabin['business'].map((offer) => ({
        name: `Business Class - $${Math.round(offer.price)}`,
        price: offer.price,
        currency: offer.currency,
        offerId: offer.id,
        features: {
          seatSelection: 'included',
          carryOn: offer.baggage?.carryOn?.quantity || 2,
          checked: offer.baggage?.checked?.quantity || 2,
          changes: 'included',
          refund: 'included',
          meals: offer.amenities?.meals || true,
          wifi: offer.amenities?.wifi || true,
          priority: true,
        },
      })),
    });
  }

  // If no cabin classes found, create one from the main flight
  if (cabinClasses.length === 0) {
    cabinClasses.push({
      cabin: 'Economy',
      options: [{
        name: `Economy - $${Math.round(flight.price)}`,
        price: flight.price,
        currency: flight.currency,
        offerId: flight.id,
        features: {
          seatSelection: 'fee',
          carryOn: flight.baggage?.carryOn?.quantity || 1,
          checked: flight.baggage?.checked?.quantity || 0,
          changes: 'fee',
          refund: 'not-allowed',
          meals: flight.amenities?.meals || false,
          wifi: flight.amenities?.wifi || false,
        },
      }],
    });
  }

  // Make sure we have a valid selected cabin - use effect to avoid setState during render
  useEffect(() => {
    if (isOpen && !cabinClasses.find(c => c.cabin === selectedCabin)) {
      setSelectedCabin(cabinClasses[0].cabin);
    }
  }, [isOpen, cabinClasses, selectedCabin]);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Update arrow visibility when cabin changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(checkScroll, 100); // Delay to ensure DOM is ready
    }
  }, [isOpen, selectedCabin]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('=== FareClassModal Debug ===');
      console.log('All fare options:', allFareOptions.map(f => ({
        id: f.id,
        price: f.price,
        cabinClass: f.cabinClass,
        carrier: f.carrier,
      })));
      console.log('Grouped by cabin keys:', Object.keys(groupedByCabin));
      console.log('Grouped by cabin details:', groupedByCabin);
      console.log('Cabin classes array:', cabinClasses);
      console.log('===========================');
    }
  }, [isOpen, allFareOptions, groupedByCabin]);

  if (!isOpen) return null;
  
  // Safety check: if no cabin classes, don't render
  if (cabinClasses.length === 0) {
    console.error('FareClassModal: No cabin classes available');
    return null;
  }

  const currentCabinClass = cabinClasses.find((c) => c.cabin === selectedCabin);
  
  // If selected cabin not found, default to first available
  if (!currentCabinClass) {
    console.warn(`FareClassModal: Selected cabin "${selectedCabin}" not found, using first available`);
    const firstCabin = cabinClasses[0];
    return null; // Will re-render with correct cabin via useEffect
  }

  // Extract time from ISO datetime (e.g., "2025-10-30T21:25:00" -> "21:25")
  const departureTime = new Date(flight.departure).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const arrivalTime = new Date(flight.arrival).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/60 dark:bg-black/80"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative inline-block w-full max-w-5xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-static-bg-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">
                    Select fare to {flight.destinationName}
                  </h2>
                  {/* Inline Flight Timeline */}
                  <div className="flex items-center gap-2 text-sm border-l border-static-bg-300 dark:border-static-bg-600 pl-4">
                    <span className="font-semibold text-static-text-900 dark:text-static-text-100">{departureTime}</span>
                    <span className="text-static-text-500 dark:text-static-text-400">{flight.origin}</span>
                    <div className="flex flex-col items-center mx-1">
                      <div className="flex items-center">
                        <div className="w-8 h-px bg-static-bg-300 dark:bg-static-bg-600"></div>
                        {flight.carrierLogo ? (
                          <img 
                            src={flight.carrierLogo} 
                            alt={flight.carrier}
                            className="w-5 h-5 rounded-full mx-1 object-contain"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-static-accent-600 dark:bg-static-accent-500 text-white text-[10px] flex items-center justify-center mx-1 font-bold">
                            {flight.carrier.substring(0, 2)}
                          </div>
                        )}
                        <div className="w-8 h-px bg-static-bg-300 dark:bg-static-bg-600"></div>
                      </div>
                      <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold mt-0.5">
                        {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <span className="font-semibold text-static-text-900 dark:text-static-text-100">{arrivalTime}</span>
                    <span className="text-static-text-500 dark:text-static-text-400">{flight.destination}</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-static-text-600 dark:text-static-text-400">
                  This flight is operated by {flight.carrier}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-static-text-400 dark:text-static-text-500 hover:text-static-text-500 dark:hover:text-static-text-400 hover:bg-static-bg-100 dark:hover:bg-static-bg-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cabin Tabs */}
          <div className="flex border-b border-static-bg-200 dark:border-static-bg-700 mb-6">
            {cabinClasses.map((cabinClass) => {
              const lowestInClass = cabinClass.options[0];
              return (
                <button
                  key={cabinClass.cabin}
                  onClick={() => {
                    setSelectedCabin(cabinClass.cabin);
                    setSelectedFare(null);
                  }}
                  className={`flex-1 py-4 px-6 text-center border-b-2 transition-colors ${
                    selectedCabin === cabinClass.cabin
                      ? 'border-static-accent-600 dark:border-static-accent-400 text-static-accent-600 dark:text-static-accent-400 bg-static-accent-50 dark:bg-static-accent-900/20'
                      : 'border-transparent text-static-text-600 dark:text-static-text-400 hover:text-static-text-900 dark:hover:text-static-text-100 hover:bg-static-bg-50 dark:hover:bg-static-bg-700'
                  }`}
                >
                  <div className="text-base font-bold">{cabinClass.cabin}</div>
                  <div className="text-sm text-static-text-500 dark:text-static-text-400 mt-1 font-semibold">
                    {lowestInClass.currency === 'USD' ? '$' : lowestInClass.currency}
                    {Math.round(lowestInClass.price)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fare Options in Selected Cabin */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-static-text-900 dark:text-static-text-100">
                Choose your {selectedCabin} fare
              </h3>
              <p className="text-sm text-static-text-500 dark:text-static-text-400">
                {currentCabinClass.options.length} option
                {currentCabinClass.options.length > 1 ? 's' : ''} available
              </p>
            </div>

            {/* Fare Options - Scrollable horizontally when more than 3 */}
            <div className="relative">
              {/* Left Arrow */}
              {currentCabinClass.options.length > 3 && showLeftArrow && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-static-accent-600 dark:bg-static-accent-500 rounded-full shadow-lg p-2 hover:bg-static-accent-700 dark:hover:bg-static-accent-600 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Right Arrow */}
              {currentCabinClass.options.length > 3 && showRightArrow && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-static-accent-600 dark:bg-static-accent-500 rounded-full shadow-lg p-2 hover:bg-static-accent-700 dark:hover:bg-static-accent-600 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}

              <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className={`${
                  currentCabinClass.options.length > 3 
                    ? 'flex gap-4 overflow-x-auto scrollbar-hide' 
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                }`}
                style={currentCabinClass.options.length > 3 ? {
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                } : {}}
              >
              {currentCabinClass.options.map((fareOption, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer flex flex-col ${
                  currentCabinClass.options.length > 3 ? 'min-w-[280px] flex-shrink-0' : ''
                } ${
                  selectedFare?.name === fareOption.name
                    ? 'border-static-accent-500 dark:border-static-accent-400 bg-static-accent-50 dark:bg-static-accent-900/20'
                    : 'border-static-bg-200 dark:border-static-bg-700 hover:border-static-accent-300 dark:hover:border-static-accent-600'
                }`}
                onClick={() => setSelectedFare(fareOption)}
              >
                {/* Price & Name - Horizontal Layout */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-static-bg-200 dark:border-static-bg-700">
                  <div>
                    <p className="text-xs text-static-text-500 dark:text-static-text-400 uppercase mb-1">{selectedCabin}</p>
                    <p className="font-bold text-static-text-900 dark:text-static-text-100">{fareOption.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-static-text-500 dark:text-static-text-400 uppercase">
                      {fareOption.currency === 'USD' ? 'US' : fareOption.currency}
                    </p>
                    <h4 className="text-2xl font-bold text-static-text-900 dark:text-static-text-100">
                      ${Math.round(fareOption.price)}
                    </h4>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 flex-1">
                  {/* Seat Selection */}
                  <div className="flex items-start gap-2 text-sm">
                    {fareOption.features.seatSelection === 'included' ? (
                      <>
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-static-text-700 dark:text-static-text-300">Seat choice included</span>
                      </>
                    ) : fareOption.features.seatSelection === 'free' ? (
                      <>
                        <Ban className="w-4 h-4 text-static-text-400 dark:text-static-text-500 mt-0.5 flex-shrink-0" />
                        <span className="text-static-text-500 dark:text-static-text-400">Seat choice for a fee</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 text-static-text-400 dark:text-static-text-500 mt-0.5 flex-shrink-0" />
                        <span className="text-static-text-500 dark:text-static-text-400">Seat choice for a fee</span>
                      </>
                    )}
                  </div>

                  {/* Baggage */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-static-text-700 dark:text-static-text-300">Personal item</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-static-text-700 dark:text-static-text-300">Carry-on bag</span>
                    </div>
                    {fareOption.features.checked > 0 ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-static-text-700 dark:text-static-text-300">
                          {fareOption.features.checked} checked bag
                          {fareOption.features.checked > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Ban className="w-4 h-4 text-static-text-400 dark:text-static-text-500 flex-shrink-0" />
                        <span className="text-static-text-500 dark:text-static-text-400">No checked bags</span>
                      </div>
                    )}
                  </div>

                  {/* Flexibility */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2 text-sm">
                      {fareOption.features.changes === 'included' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-static-text-700 dark:text-static-text-300">Changes included</span>
                        </>
                      ) : fareOption.features.changes === 'fee' ? (
                        <>
                          <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0 text-xs font-bold">
                            $
                          </span>
                          <span className="text-static-text-700 dark:text-static-text-300">Change fee</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-static-text-400 dark:text-static-text-500 mt-0.5 flex-shrink-0" />
                          <span className="text-static-text-500 dark:text-static-text-400">Changes not allowed</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      {fareOption.features.refund === 'included' ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-static-text-700 dark:text-static-text-300">Refundable</span>
                        </>
                      ) : fareOption.features.refund === 'fee' ? (
                        <>
                          <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0 text-xs font-bold">
                            $
                          </span>
                          <span className="text-static-text-700 dark:text-static-text-300">Refund fee</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-static-text-400 dark:text-static-text-500 mt-0.5 flex-shrink-0" />
                          <span className="text-static-text-500 dark:text-static-text-400">Non-refundable</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-1">
                    {fareOption.features.wifi ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-static-text-700 dark:text-static-text-300">Wi-Fi</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Ban className="w-4 h-4 text-static-text-400 dark:text-static-text-500 flex-shrink-0" />
                        <span className="text-static-text-500 dark:text-static-text-400">No Wi-Fi</span>
                      </div>
                    )}
                    {fareOption.features.meals ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Utensils className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-static-text-700 dark:text-static-text-300">Meals</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Ban className="w-4 h-4 text-static-text-400 dark:text-static-text-500 flex-shrink-0" />
                        <span className="text-static-text-500 dark:text-static-text-400">No meals</span>
                      </div>
                    )}
                    {fareOption.features.priority && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-static-text-700 dark:text-static-text-300">Priority boarding</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => onSelectFare(fareOption, selectedCabin)}
                  className="w-full mt-4 py-3 bg-static-accent-600 dark:bg-static-accent-500 text-white font-semibold rounded-lg hover:bg-static-accent-700 dark:hover:bg-static-accent-600 transition-colors"
                >
                  Select
                </button>
              </div>
            ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
