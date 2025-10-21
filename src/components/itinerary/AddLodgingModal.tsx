'use client';

import { useState, useEffect } from 'react';
import { Destination, Lodging } from '@/types/itinerary';

interface AddLodgingModalProps {
  destination: Destination;
  onClose: () => void;
  onSave: (lodging: Omit<Lodging, 'id'>) => void;
}

export default function AddLodgingModal({ destination, onClose, onSave }: AddLodgingModalProps) {
  const [step, setStep] = useState<'nights' | 'details'>('nights');
  const [nights, setNights] = useState(destination.nights);
  const [hotelName, setHotelName] = useState('');
  
  // Calculate how many nights are already allocated
  const allocatedNights = destination.lodgings?.reduce((sum, l) => sum + l.nights, 0) || 0;
  const availableNights = destination.nights - allocatedNights;
  
  // Set initial nights to available nights or destination nights
  useEffect(() => {
    setNights(Math.min(availableNights, destination.nights));
  }, [availableNights, destination.nights]);

  const handleContinue = () => {
    setStep('details');
  };

  const handleSave = () => {
    if (!hotelName.trim()) return;
    
    onSave({
      name: hotelName.trim(),
      nights: nights,
    });
    
    onClose();
  };

  const percentage = destination.nights > 0 ? (nights / destination.nights) * 100 : 0;

  return (
    <>
      {/* Slide-up Panel - Covers entire left panel */}
      <div className="absolute inset-0 bg-white z-50 flex flex-col animate-slide-up">
        {step === 'nights' ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
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
              <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto">
                {/* Available Nights Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        {availableNights} of {destination.nights} nights available
                      </p>
                      {allocatedNights > 0 && (
                        <p className="text-xs text-blue-700 mt-1">
                          {allocatedNights} nights already allocated to other lodging
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nights Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      How many nights?
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{nights}</span>
                      <span className="text-sm text-gray-500">
                        {nights === 1 ? 'night' : 'nights'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max={Math.max(1, availableNights)}
                      value={nights}
                      onChange={(e) => setNights(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
                      }}
                      disabled={availableNights === 0}
                    />
                    
                    {/* Percentage indicator */}
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>1 night</span>
                      <span className="font-medium text-blue-600">{Math.round(percentage)}%</span>
                      <span>{destination.nights} nights</span>
                    </div>
                  </div>

                  {availableNights === 0 && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      All nights are allocated. Remove existing lodging to add new ones.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={handleContinue}
                  disabled={availableNights === 0}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
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
                    <p className="text-sm text-gray-500">{nights} {nights === 1 ? 'night' : 'nights'} in {destination.name}</p>
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
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider:disabled::-webkit-slider-thumb {
          background: #9CA3AF;
        }
        
        .slider:disabled::-moz-range-thumb {
          background: #9CA3AF;
        }

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