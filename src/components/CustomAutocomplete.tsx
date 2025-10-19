'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  createDebouncedSearch, 
  formatGooglePlace, 
  getFormattedAddress,
  getCountryFromGooglePlace, 
  getGooglePlaceType,
  GooglePlace 
} from '@/utils/google-places';

// Props for the autocomplete component
interface CustomAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  onSelectPlace?: (place: GooglePlace) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// Create debounced search function
const debouncedSearch = createDebouncedSearch(300);

export default function CustomAutocomplete({
  value,
  onChange,
  onSelect,
  onSelectPlace,
  placeholder = "Search for a city, country, or destination...",
  className = "",
  required = false
}: CustomAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search Google Places with debouncing
  useEffect(() => {
    if (value && value.trim().length >= 2) {
      setIsLoading(true);
      debouncedSearch(value.trim())
        .then((results) => {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Search error:', error);
          setSuggestions([]);
          setShowSuggestions(false);
          setIsLoading(false);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (place: GooglePlace) => {
    const placeName = formatGooglePlace(place);
    onChange(placeName);
    onSelect?.(placeName);
    onSelectPlace?.(place);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const selected = suggestions[selectedIndex];
          const placeName = formatGooglePlace(selected);
          onChange(placeName);
          onSelect?.(placeName);
          onSelectPlace?.(selected);
          setShowSuggestions(false);
          setSuggestions([]);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Reset border color and width
    e.target.style.borderColor = '#d1d5db';
    e.target.style.borderWidth = '1px';
    e.target.style.padding = '12px 16px';
    
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0 && value) {
      setShowSuggestions(true);
    }
  };

  const getPlaceIcon = (place: GooglePlace) => {
    const placeType = getGooglePlaceType(place);
    switch (placeType) {
      case 'country':
        return <span className="text-green-600 text-lg">�</span>;
      case 'state':
        return <span className="text-purple-600 text-lg">🗺️</span>;
      case 'city':
        return <span className="text-blue-600 text-lg">🏙️</span>;
      case 'attraction':
        return <span className="text-orange-600 text-lg">�</span>;
      default:
        return <span className="text-gray-600 text-lg">📍</span>;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={(e) => {
          handleFocus();
          e.target.style.borderColor = '#3b82f6';
          e.target.style.borderWidth = '2px';
          e.target.style.padding = '11px 15px';
          e.target.style.boxShadow = 'none';
          e.target.style.outline = 'none';
        }}
        placeholder={placeholder}
        className={className.replace(/focus:[^\s]+/g, '').replace(/px-4/g, '').replace(/py-3/g, '')}
        style={{ 
          boxShadow: 'none',
          outline: 'none',
          borderWidth: '1px',
          boxSizing: 'border-box',
          padding: '12px 16px'
        }}
        required={required}
        autoComplete="off"
      />

      {isLoading && value.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 text-sm">Searching...</span>
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !isLoading && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((place, index) => {
            const placeType = getGooglePlaceType(place);
            const country = getCountryFromGooglePlace(place);
            
            return (
              <div
                key={place.place_id}
                onClick={() => handleSuggestionClick(place)}
                className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                  index === selectedIndex
                    ? 'bg-blue-50 text-blue-900'
                    : 'hover:bg-gray-50'
                } ${index === 0 ? 'rounded-t-xl' : ''} ${
                  index === suggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm text-gray-900 font-medium truncate">
                      {place.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {getFormattedAddress(place)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Google attribution */}
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
            Powered by Google Places
          </div>
        </div>
      )}
      
      {showSuggestions && suggestions.length === 0 && !isLoading && value.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg p-4">
          <div className="text-center text-gray-500 text-sm">
            No places found for &quot;{value}&quot;
          </div>
        </div>
      )}
    </div>
  );
}