'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Search, MapPin, Globe, Mountain, Navigation } from 'lucide-react';
import { destinations, Destination } from '@/data/destinations';

interface CustomAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void; // Called only when user selects from dropdown
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// Configure fuzzy search
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'displayName', weight: 0.3 }
  ],
  threshold: 0.3, // Lower = more strict matching
  includeScore: true,
  minMatchCharLength: 1
};

const fuse = new Fuse(destinations, fuseOptions);

export default function CustomAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search for a country, state, city, or ski resort...",
  className = "",
  required = false
}: CustomAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const searchDestinations = useCallback((query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    // Use fuzzy search for smart matching
    const results = fuse.search(query, { limit: 8 });
    
    // Extract the destinations from search results
    const matchedDestinations = results.map(result => result.item);
    
    // If no fuzzy matches, try simple includes search as fallback
    if (matchedDestinations.length === 0) {
      const simpleMatches = destinations.filter(dest => 
        dest.name.toLowerCase().includes(query.toLowerCase()) ||
        dest.displayName.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      
      setSuggestions(simpleMatches);
    } else {
      setSuggestions(matchedDestinations);
    }
  }, []);

  useEffect(() => {
    if (value) {
      searchDestinations(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, searchDestinations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (destination: Destination) => {
    onChange(destination.displayName);
    onSelect?.(destination.displayName);
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
          onChange(selected.displayName);
          onSelect?.(selected.displayName);
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

  const handleBlur = () => {
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

  const getDestinationIcon = (type: string) => {
    switch (type) {
      case 'ski-resort':
        return <span className="text-blue-500 text-lg">🎿</span>;
      case 'country':
        return <span className="text-green-600 text-lg">🌍</span>;
      case 'state':
        return <span className="text-purple-600 text-lg">🗺️</span>;
      case 'city':
        return <span className="text-gray-600 text-lg">🏙️</span>;
      default:
        return <span className="text-gray-600 text-lg">🏙️</span>;
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
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((destination, index) => (
            <div
              key={`${destination.name}-${destination.country}-${destination.state || ''}-${destination.type}`}
              onClick={() => handleSuggestionClick(destination)}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              } ${index === 0 ? 'rounded-t-xl' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {getDestinationIcon(destination.type)}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm text-gray-900 font-medium truncate">
                    {destination.displayName || destination.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {destination.type === 'country' && 'Country'}
                    {destination.type === 'state' && `State • ${destination.country}`}
                    {destination.type === 'ski-resort' && `Ski Resort • ${destination.country}`}
                    {destination.type === 'city' && `City • ${destination.state ? `${destination.state}, ` : ''}${destination.country}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}