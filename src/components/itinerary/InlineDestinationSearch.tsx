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

interface InlineDestinationSearchProps {
  onAddDestination: (destination: Omit<TripDestination, 'id' | 'order'>) => void;
  existingDestinations: TripDestination[];
}

// Create debounced search function
const debouncedSearch = createDebouncedSearch(300);

export default function InlineDestinationSearch({
  onAddDestination,
  existingDestinations
}: InlineDestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search Google Places with debouncing
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      setIsLoading(true);
      debouncedSearch(searchQuery.trim())
        .then((results) => {
          setPlaces(results);
          setShowResults(results.length > 0);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Search error:', error);
          setPlaces([]);
          setShowResults(false);
          setIsLoading(false);
        });
    } else {
      setPlaces([]);
      setShowResults(false);
      setIsLoading(false);
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

    console.log('InlineDestinationSearch calling onAddDestination with:', newTripDestination);
    onAddDestination(newTripDestination);
    
    // Reset and close
    setSearchQuery('');
    setPlaces([]);
    setShowResults(false);
  };

  // Handle clicks outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
          placeholder="Add destination..."
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute left-4 right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 text-sm">Searching...</span>
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
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {place.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {getFormattedAddress(place)}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm">No destinations found for &quot;{searchQuery}&quot;</p>
              <p className="text-gray-400 text-xs mt-1">Try searching for a city or country</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}