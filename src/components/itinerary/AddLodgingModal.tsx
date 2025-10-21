'use client';

import { useState } from 'react';
import { Destination, Lodging } from '@/types/itinerary';

interface AddLodgingModalProps {
  destination: Destination;
  onClose: () => void;
  onSave: (lodging: Omit<Lodging, 'id'>) => void;
}

export default function AddLodgingModal({ destination, onClose, onSave }: AddLodgingModalProps) {
  const [step, setStep] = useState<'nights' | 'details'>('nights');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [stayAllNights, setStayAllNights] = useState(false);
  const [hotelName, setHotelName] = useState('');
  
  // Calculate how many nights are already allocated
  const allocatedNights = destination.lodgings?.reduce((sum, l) => sum + l.nights, 0) || 0;
  const availableNights = destination.nights - allocatedNights;
  
  // Generate all available dates
  const getAllDates = () => {
    if (!destination.startDate || !destination.endDate) return [];
    
    const start = new Date(destination.startDate);
    const end = new Date(destination.endDate);
    const dates: string[] = [];
    
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };
  
  // Get all dates that are already booked by existing lodgings
  const getBookedDates = (): Set<string> => {
    const booked = new Set<string>();
    
    if (!destination.lodgings) return booked;
    
    destination.lodgings.forEach(lodging => {
      if (lodging.checkIn && lodging.checkOut) {
        const start = new Date(lodging.checkIn);
        const end = new Date(lodging.checkOut);
        const current = new Date(start);
        
        // Add all dates from check-in to the day before check-out (nights)
        while (current < end) {
          booked.add(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    });
    
    return booked;
  };
  
  // Check if a date is already booked
  const isDateBooked = (dateStr: string): boolean => {
    return getBookedDates().has(dateStr);
  };
  
  // Get available (unbooked) dates
  const getAvailableDates = (): string[] => {
    const allDates = getAllDates();
    const booked = getBookedDates();
    return allDates.filter(date => !booked.has(date));
  };
  
  // Calculate selected dates count
  const getSelectedNights = () => {
    if (stayAllNights) {
      return getAvailableDates().length;
    }
    if (!startDate || !endDate) return 0;
    
    const allDates = getAllDates();
    const startIdx = allDates.indexOf(startDate);
    const endIdx = allDates.indexOf(endDate);
    
    if (startIdx === -1 || endIdx === -1) return 0;
    return endIdx - startIdx + 1;
  };

  const handleContinue = () => {
    setStep('details');
  };

  const handleSave = () => {
    if (!hotelName.trim() || getSelectedNights() === 0) return;
    
    let checkIn: string | undefined;
    let checkOut: string | undefined;
    
    if (stayAllNights) {
      // Use all available (unbooked) dates
      const availableDates = getAvailableDates();
      if (availableDates.length > 0) {
        checkIn = availableDates[0];
        // Check-out is the day after the last night
        const lastNight = new Date(availableDates[availableDates.length - 1]);
        lastNight.setDate(lastNight.getDate() + 1);
        checkOut = lastNight.toISOString().split('T')[0];
      }
    } else if (startDate && endDate) {
      checkIn = startDate;
      // Check-out is the day after the end date (since end date is the last night)
      const checkOutDate = new Date(endDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      checkOut = checkOutDate.toISOString().split('T')[0];
    }
    
    onSave({
      name: hotelName.trim(),
      nights: getSelectedNights(),
      checkIn,
      checkOut,
    });
    
    onClose();
  };

  const handleDateClick = (dateStr: string) => {
    // Don't allow clicking booked dates
    if (isDateBooked(dateStr)) return;
    
    // If "stay all nights" is checked, uncheck it first
    if (stayAllNights) {
      setStayAllNights(false);
    }
    
    // If no start date or both dates are set, set as new start
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
    } 
    // If start date exists but no end date
    else if (startDate && !endDate) {
      const allDates = getAllDates();
      const startIdx = allDates.indexOf(startDate);
      const clickedIdx = allDates.indexOf(dateStr);
      
      // If clicked date is before start, make it the new start
      if (clickedIdx < startIdx) {
        setStartDate(dateStr);
        setEndDate(null);
      } else {
        // Check if any dates in between are booked
        const hasBookedInBetween = allDates
          .slice(startIdx, clickedIdx + 1)
          .some(date => isDateBooked(date));
        
        if (hasBookedInBetween) {
          // Don't allow selecting end date if there are booked dates in between
          return;
        }
        
        // Set as end date
        setEndDate(dateStr);
      }
    }
  };
  
  const handleStayAllNightsChange = (checked: boolean) => {
    if (checked && getAvailableDates().length === 0) {
      // Don't allow checking if no available dates
      return;
    }
    
    setStayAllNights(checked);
    if (checked) {
      setStartDate(null);
      setEndDate(null);
    }
  };
  
  const isDateInRange = (dateStr: string) => {
    if (stayAllNights) return !isDateBooked(dateStr);
    if (!startDate) return false;
    
    const allDates = getAllDates();
    const startIdx = allDates.indexOf(startDate);
    const dateIdx = allDates.indexOf(dateStr);
    
    if (!endDate && !hoverDate) {
      return dateStr === startDate;
    }
    
    const endOrHover = endDate || hoverDate;
    if (!endOrHover) return dateStr === startDate;
    
    const endIdx = allDates.indexOf(endOrHover);
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);
    
    // Check if this date is in range and not booked
    if (dateIdx >= minIdx && dateIdx <= maxIdx) {
      // For hover preview, stop at first booked date
      if (hoverDate && !endDate) {
        const rangeSlice = allDates.slice(minIdx, maxIdx + 1);
        const firstBookedIdx = rangeSlice.findIndex(d => isDateBooked(d));
        
        if (firstBookedIdx !== -1) {
          const actualMaxIdx = minIdx + firstBookedIdx - 1;
          return dateIdx >= minIdx && dateIdx <= actualMaxIdx;
        }
      }
      return true;
    }
    
    return false;
  };
  
  const isDateStart = (dateStr: string) => {
    if (stayAllNights) return false;
    return dateStr === startDate;
  };
  
  const isDateEnd = (dateStr: string) => {
    if (stayAllNights) return false;
    return dateStr === endDate;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <>
      {/* Slide-up Panel - Covers entire left panel */}
      <div className="absolute inset-0 bg-white z-50 animate-slide-up h-full">
        {step === 'nights' ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white z-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-gray-900">Add Lodging</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500">{destination.name}</p>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto min-h-0 pb-24">
                {/* Context Note */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        You're staying in {destination.name} for {destination.nights} {destination.nights === 1 ? 'night' : 'nights'}
                      </p>
                      <p className="text-xs text-blue-700">
                        {availableNights === destination.nights ? (
                          `How many nights would you like to book lodging for?`
                        ) : availableNights > 0 ? (
                          `${allocatedNights} ${allocatedNights === 1 ? 'night' : 'nights'} already booked. ${availableNights} ${availableNights === 1 ? 'night' : 'nights'} remaining.`
                        ) : (
                          `All ${destination.nights} nights are already booked.`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date Selection Calendar */}
                <div>
                  {/* Stay All Nights Checkbox */}
                  <div className={`mb-4 p-4 border rounded-lg ${
                    availableNights === 0 
                      ? 'bg-gray-50 border-gray-200 opacity-60' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <label className={`flex items-center gap-3 ${availableNights > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                      <input
                        type="checkbox"
                        checked={stayAllNights}
                        onChange={(e) => handleStayAllNightsChange(e.target.checked)}
                        disabled={availableNights === 0}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          Stay all {availableNights === destination.nights ? '' : 'remaining '}nights in {destination.name}
                        </span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {availableNights === 0 ? (
                            'No available nights to book'
                          ) : availableNights === destination.nights ? (
                            `Book lodging for all ${destination.nights} ${destination.nights === 1 ? 'night' : 'nights'}`
                          ) : (
                            `Book lodging for the ${availableNights} remaining ${availableNights === 1 ? 'night' : 'nights'}`
                          )}
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      {stayAllNights ? 'All nights selected' : 'Select check-in and check-out dates'}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{getSelectedNights()}</span>
                      <span className="text-sm text-gray-500">
                        {getSelectedNights() === 1 ? 'night' : 'nights'}
                      </span>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  {!stayAllNights && destination.startDate && destination.endDate && (() => {
                    const dates = getAllDates();

                    return (
                      <div className="space-y-2">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className="text-xs font-medium text-gray-500 py-1">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Date grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {/* Empty cells for offset */}
                          {Array.from({ length: new Date(dates[0]).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          
                          {/* Date cells */}
                          {dates.map((dateStr) => {
                            const isInRange = isDateInRange(dateStr);
                            const isStart = isDateStart(dateStr);
                            const isEnd = isDateEnd(dateStr);
                            const isBooked = isDateBooked(dateStr);
                            const date = new Date(dateStr);
                            const day = date.getDate();
                            
                            return (
                              <button
                                key={dateStr}
                                onClick={() => handleDateClick(dateStr)}
                                onMouseEnter={() => !isBooked && setHoverDate(dateStr)}
                                onMouseLeave={() => setHoverDate(null)}
                                disabled={isBooked}
                                className={`
                                  aspect-square rounded-lg flex flex-col items-center justify-center
                                  text-sm font-medium transition-all relative
                                  ${isBooked
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through'
                                    : isInRange
                                      ? isStart || isEnd
                                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 z-10'
                                        : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                                  }
                                `}
                              >
                                <span>{day}</span>
                                {isBooked && (
                                  <span className="text-[8px] font-semibold mt-0.5">Booked</span>
                                )}
                                {!isBooked && isStart && (
                                  <span className="text-[9px] font-semibold mt-0.5">Check-in</span>
                                )}
                                {!isBooked && isEnd && (
                                  <span className="text-[9px] font-semibold mt-0.5">Check-out</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Helper text */}
                        <p className="text-xs text-gray-500 text-center">
                          {!startDate && 'Select your check-in date'}
                          {startDate && !endDate && 'Now select your check-out date'}
                          {startDate && endDate && 'Click to change dates'}
                        </p>
                      </div>
                    );
                  })()}

                  {availableNights === 0 && (
                    <p className="text-sm text-amber-600 mt-4 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      All nights are allocated. Remove existing lodging to add new ones.
                    </p>
                  )}
                </div>

                {/* Continue Button - Inside content area */}
                <div className="mt-6">
                  <button
                    onClick={handleContinue}
                    disabled={getSelectedNights() === 0}
                    className="w-full px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Continue</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
            </div>
          </div>
        ) : (
            <>
              {/* Header - Details Step */}
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3 mb-1">
                  <button
                    onClick={() => setStep('nights')}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">Add Lodging Details</h2>
                    <p className="text-sm text-gray-500">{getSelectedNights()} {getSelectedNights() === 1 ? 'night' : 'nights'} in {destination.name}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content - Details Step */}
              <div className="px-6 py-6 space-y-4 flex-1 overflow-y-auto">
                {/* Booking Provider Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Search for hotels
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Booking.com */}
                    <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-white font-bold text-lg">B</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Booking.com</span>
                    </button>

                    {/* Expedia */}
                    <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-blue-900 font-bold text-lg">E</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Expedia</span>
                    </button>

                    {/* Hotels.com */}
                    <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-white font-bold text-lg">H</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Hotels.com</span>
                    </button>

                    {/* Airbnb */}
                    <button className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-white font-bold text-lg">A</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">Airbnb</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">or add manually</span>
                  </div>
                </div>

                {/* Manual Entry Form */}
                <div>
                  <label htmlFor="hotel-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel Name
                  </label>
                  <input
                    id="hotel-name"
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="e.g., Hilton Paris Opera"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Footer - Details Step */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={handleSave}
                  disabled={!hotelName.trim()}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Add Lodging
                </button>
              </div>
            </>
          )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}