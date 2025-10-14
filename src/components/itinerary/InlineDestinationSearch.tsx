'use client';

import { useState, useRef, useEffect } from 'react';
import { Destination as TripDestination } from '@/types/itinerary';
import { destinations } from '@/data/destinations';

interface InlineDestinationSearchProps {
  onAddDestination: (destination: Omit<TripDestination, 'id' | 'order'>) => void;
  existingDestinations: TripDestination[];
}

export default function InlineDestinationSearch({
  onAddDestination,
  existingDestinations
}: InlineDestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDestinations, setFilteredDestinations] = useState<typeof destinations>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter destinations based on search query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setFilteredDestinations([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    // Debounce search
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      
      // Accent-insensitive search (matching CustomAutocomplete quality)
      const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[\u0000-\u001f\u007f]/g, '').toLowerCase();
      const queryNorm = normalize(query);
      
      const smartRanked = destinations
        .filter(dest => {
          const displayName = dest.displayName.toLowerCase();
          const name = dest.name.toLowerCase();
          const country = dest.country.toLowerCase();
          const state = dest.state?.toLowerCase() || '';
          
          // Normalized versions for accent-insensitive matching
          const displayNameNorm = normalize(dest.displayName);
          const nameNorm = normalize(dest.name);
          const countryNorm = normalize(dest.country);
          const stateNorm = dest.state ? normalize(dest.state) : '';
          
          // Search both original and normalized versions (bidirectional accent matching)
          return displayName.includes(query) || name.includes(query) || country.includes(query) || state.includes(query) ||
                 displayNameNorm.includes(queryNorm) || nameNorm.includes(queryNorm) || countryNorm.includes(queryNorm) || stateNorm.includes(queryNorm);
        })
        .sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aDisplayName = a.displayName.toLowerCase();
          const bDisplayName = b.displayName.toLowerCase();
          
          // FIRST: International city prioritization (same as CustomAutocomplete)
          const internationalCityPriority: { [key: string]: string } = {
            'geneva': 'Switzerland',
            'geneve': 'Switzerland',
            'paris': 'France', 
            'london': 'United Kingdom',
            'rome': 'Italy',
            'madrid': 'Spain',
            'berlin': 'Germany',
            'vienna': 'Austria',
            'zurich': 'Switzerland'
          };
          
          const preferredCountry = internationalCityPriority[query];
          if (preferredCountry) {
            if (a.country === preferredCountry && b.country !== preferredCountry) return -1;
            if (a.country !== preferredCountry && b.country === preferredCountry) return 1;
          }
          
          // Check if name starts with the query (perfect matches)
          const aStartsWithQuery = aName.startsWith(query) || aDisplayName.startsWith(query);
          const bStartsWithQuery = bName.startsWith(query) || bDisplayName.startsWith(query);
          
          if (aStartsWithQuery && !bStartsWithQuery) return -1;
          if (!aStartsWithQuery && bStartsWithQuery) return 1;
          
          // For names that start with query, prioritize major cities
          if (aStartsWithQuery && bStartsWithQuery) {
            const majorCities = [
              'london, united kingdom', 'paris, france', 'new york, ny, united states',
              'tokyo, japan', 'sydney, australia', 'rome, italy', 'madrid, spain',
              'berlin, germany', 'amsterdam, netherlands', 'barcelona, spain',
              'moscow, russia', 'beijing, china', 'mumbai, india', 'istanbul, turkey',
              'los angeles, ca, united states', 'chicago, il, united states',
              'toronto, on, canada', 'vancouver, bc, canada', 'montreal, qc, canada'
            ];
            
            const aIsMajor = majorCities.some(city => city === a.displayName.toLowerCase());
            const bIsMajor = majorCities.some(city => city === b.displayName.toLowerCase());
            
            if (aIsMajor && !bIsMajor) return -1;
            if (!aIsMajor && bIsMajor) return 1;
            
            // If both or neither are major cities, sort alphabetically
            return a.displayName.localeCompare(b.displayName);
          }
          
          // For non-starting matches, prioritize by how well they contain the query
          const aContainsQuery = aName.includes(query) || aDisplayName.includes(query);
          const bContainsQuery = bName.includes(query) || bDisplayName.includes(query);
          
          if (aContainsQuery && !bContainsQuery) return -1;
          if (!aContainsQuery && bContainsQuery) return 1;
          
          // Countries get priority over cities/regions for partial matches
          const aIsCountry = a.type === 'country';
          const bIsCountry = b.type === 'country';
          
          if (aIsCountry && !bIsCountry) return -1;
          if (!aIsCountry && bIsCountry) return 1;
          
          // Cities get priority over ski resorts for partial matches
          const aIsCity = a.type === 'city';
          const bIsCity = b.type === 'city';
          
          if (aIsCity && !bIsCity) return -1;
          if (!aIsCity && bIsCity) return 1;
          
          // Alphabetical order as final tiebreaker
          return a.displayName.localeCompare(b.displayName);
        })
        .slice(0, 5); // Limit to 5 results
      
      setFilteredDestinations(smartRanked);
      setShowResults(true);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle destination selection
  const handleDestinationSelect = (destination: typeof destinations[0]) => {
    // Create a trip destination from the database destination
    const newTripDestination: Omit<TripDestination, 'id' | 'order'> = {
      name: destination.displayName,
      startDate: '', // Will be set by user later
      endDate: '', // Will be set by user later
      nights: 0, // Will be set by user using night counters
      lodging: '',
      estimatedCost: 0
    };

    onAddDestination(newTripDestination);
    
    // Reset and close
    setSearchQuery('');
    setFilteredDestinations([]);
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
          ) : filteredDestinations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredDestinations.map((destination, index) => (
                <button
                  key={index}
                  onClick={() => handleDestinationSelect(destination)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {destination.displayName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {destination.country}
                        {destination.state && ` • ${destination.state}`}
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {destination.type}
                        </span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm">No destinations found for "{searchQuery}"</p>
              <p className="text-gray-400 text-xs mt-1">Try searching for a city or country</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}