'use client';

import { useState, useRef, useEffect } from 'react';
import { Destination as TripDestination } from '@/types/itinerary';
import { destinations } from '@/data/destinations';

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDestination: (destination: Omit<TripDestination, 'id' | 'order'>) => void;
  existingDestinations: TripDestination[];
}

export default function AddDestinationModal({
  isOpen,
  onClose,
  onAddDestination,
  existingDestinations
}: AddDestinationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDestinations, setFilteredDestinations] = useState<typeof destinations>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter destinations based on search query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setFilteredDestinations([]);
      return;
    }

    setIsLoading(true);
    
    // Debounce search
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      
      // Smart scoring system for better relevance
      const scored = destinations
        .map(dest => {
          const displayName = dest.displayName.toLowerCase();
          const name = dest.name.toLowerCase();
          const country = dest.country.toLowerCase();
          const state = dest.state?.toLowerCase() || '';
          
          let score = 0;
          
          // Exact match gets highest score
          if (displayName === query || name === query) {
            score = 1000;
          }
          // Starts with query gets high score
          else if (displayName.startsWith(query) || name.startsWith(query)) {
            score = 100;
          }
          // Word boundary match gets medium score
          else if (
            displayName.includes(' ' + query) || 
            name.includes(' ' + query) ||
            displayName.startsWith(query) ||
            name.startsWith(query)
          ) {
            score = 50;
          }
          // Contains query gets lower score
          else if (displayName.includes(query) || name.includes(query)) {
            score = 10;
          }
          // Country/state match gets lowest score
          else if (country.includes(query) || state.includes(query)) {
            score = 1;
          }
          
          // Boost score for shorter names (more likely to be what user wants)
          if (score > 0) {
            score += Math.max(0, 50 - displayName.length);
          }
          
          return { ...dest, score };
        })
        .filter(dest => dest.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Limit to 10 results
      
      setFilteredDestinations(scored);
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
          ) : filteredDestinations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredDestinations.map((destination, index) => (
                <button
                  key={index}
                  onClick={() => handleDestinationSelect(destination)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {destination.displayName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {destination.country}
                        {destination.state && ` • ${destination.state}`}
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {destination.type}
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-600">No destinations found for "{searchQuery}"</p>
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