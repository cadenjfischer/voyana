'use client';

import { useState, useRef, useEffect } from 'react';
import { Destination as TripDestination } from '@/types/itinerary';
import { 
  createDebouncedSearch, 
  formatGooglePlace, 
  getFormattedAddress,
  getCountryFromGooglePlace, 
  getGooglePlaceType,
  GooglePlace 
} from '@/utils/google-places';

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDestination: (destination: Omit<TripDestination, 'id' | 'order'>) => void;
  existingDestinations: TripDestination[];
}

// Create debounced search function
const debouncedSearch = createDebouncedSearch(300);

export default function AddDestinationModal({
  isOpen,
  onClose,
  onAddDestination,
  existingDestinations
}: AddDestinationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Search Google Places with debouncing
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      setIsLoading(true);
      setError('');
      debouncedSearch(searchQuery.trim())
        .then((results) => {
          setPlaces(results);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Search error:', error);
          setPlaces([]);
          setError('Search failed. Please try again.');
          setIsLoading(false);
        });
    } else {
      setPlaces([]);
      setIsLoading(false);
      setError('');
    }
  }, [searchQuery]);

  // Handle destination selection
  const handleDestinationSelect = (place: GooglePlace) => {
    // Create a trip destination from the Google Place
    const newTripDestination: Omit<TripDestination, 'id' | 'order'> = {
      name: formatGooglePlace(place),
      startDate: '', // Will be set by user later
      endDate: '', // Will be set by user later
      nights: 0, // Will be set by user using night counters
      lodging: '',
      estimatedCost: 0,
      // Include coordinates from Google Places API
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      }
    };

    onAddDestination(newTripDestination);
    
    // Reset and close
    setSearchQuery('');
    setPlaces([]);
    onClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Add Destination</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-600"
              placeholder="Search for a city or destination..."
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : places.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {places.map((place, index) => {
                const placeType = getGooglePlaceType(place);
                const country = getCountryFromGooglePlace(place);
                
                return (
                  <button
                    key={place.place_id}
                    onClick={() => handleDestinationSelect(place)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {place.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getFormattedAddress(place)}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-600">No destinations found for &quot;{searchQuery}&quot;</p>
              <p className="text-gray-400 text-sm mt-1">Try searching for a city or country</p>
            </div>
          ) : searchQuery.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Keep typing to search destinations...</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <p className="text-gray-600">Search for your next destination</p>
              <p className="text-gray-400 text-sm mt-1">Type at least 2 characters to start searching</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}