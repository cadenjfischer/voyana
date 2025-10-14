'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Search, MapPin, Globe, Mountain, Navigation } from 'lucide-react';
import { destinations, Destination } from '@/data/destinations';
import normalizeString from '@/utils/strings';
const normalize = normalizeString;

// Props for the autocomplete component
interface CustomAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// Build a searchable copy of destinations that includes both normalized and original fields
const searchableDestinations = destinations.map(dest => ({
  ...dest,
  searchName: normalize(dest.name || ''),
  searchDisplayName: normalize(dest.displayName || ''),
  originalName: (dest.name || '').toLowerCase(),
  originalDisplayName: (dest.displayName || '').toLowerCase()
}));

// Configure fuzzy search to use both normalized and original fields
const fuseOptions = {
  keys: [
    { name: 'searchName', weight: 0.4 },          // normalized name (geneva->geneva, genève->geneve)
    { name: 'originalName', weight: 0.4 },        // original name (geneva->geneva, genève->genève) 
    { name: 'searchDisplayName', weight: 0.1 },   // normalized display
    { name: 'originalDisplayName', weight: 0.1 }  // original display
  ],
  threshold: 0.6, // more permissive to catch popular cities like Geneva/Genève
  includeScore: true,
  minMatchCharLength: 1
};

const fuse = new Fuse(searchableDestinations, fuseOptions);

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

    const qNorm = normalize(query);

    // Use fuzzy search on normalized fields for smart matching
    const results = fuse.search(qNorm, { limit: 30 }); // Get more results for smart ranking
    
    // Extract the destinations from search results (strip added search fields)
    let matchedDestinations = results.map(result => {
      const { searchName, searchDisplayName, originalName, originalDisplayName, ...rest } = result.item as any;
      return rest as Destination;
    });

    // Add fallback includes search to catch obvious matches fuzzy might miss
    const includesMatches = destinations.filter(dest => {
      const nameNorm = normalize(dest.name || '');
      const displayNorm = normalize(dest.displayName || '');
      const nameOrig = dest.name?.toLowerCase() || '';
      const displayOrig = dest.displayName?.toLowerCase() || '';
      
      return nameNorm.includes(qNorm) || displayNorm.includes(qNorm) || 
             // Also try startsWith for better matches
             nameNorm.startsWith(qNorm) || displayNorm.startsWith(qNorm) ||
             // Bidirectional accent matching: english "geneva" should find "Genève" 
             nameOrig.includes(query.toLowerCase()) || displayOrig.includes(query.toLowerCase()) ||
             nameOrig.startsWith(query.toLowerCase()) || displayOrig.startsWith(query.toLowerCase());
    });
    
    // Combine fuzzy and includes results, removing duplicates
    const allMatches = [...matchedDestinations];
    for (const includeMatch of includesMatches) {
      if (!allMatches.find(m => m.name === includeMatch.name && m.country === includeMatch.country)) {
        allMatches.push(includeMatch);
      }
    }
    matchedDestinations = allMatches.slice(0, 30);
    
    // Smart ranking: prioritize exact word matches first
    const smartRanked = matchedDestinations.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // FIRST: Special case prioritization for major international cities
      // This handles cases like "geneva" -> should prioritize Switzerland over US
      const internationalCityPriority: { [key: string]: string } = {
        'geneva': 'Switzerland',
        'geneve': 'Switzerland',  // also handle the normalized version
        'paris': 'France', 
        'london': 'United Kingdom',
        'rome': 'Italy',
        'madrid': 'Spain',
        'berlin': 'Germany',
        'vienna': 'Austria',
        'zurich': 'Switzerland'
      };
      
      const preferredCountry = internationalCityPriority[queryLower];
      if (preferredCountry) {
        // Strongly prioritize the international city over local variants
        if (a.country === preferredCountry && b.country !== preferredCountry) return -1;
        if (a.country !== preferredCountry && b.country === preferredCountry) return 1;
      }
      
      // Check if name starts with the query (perfect matches)
      const aStartsWithQuery = aName.startsWith(queryLower);
      const bStartsWithQuery = bName.startsWith(queryLower);
      
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
          'toronto, on, canada', 'vancouver, bc, canada', 'montreal, qc, canada',
          // Add more European capitals and major cities
          'genève, switzerland', 'geneva, switzerland', 'zurich, switzerland',
          'vienna, austria', 'brussels, belgium', 'budapest, hungary',
          'prague, czech republic', 'warsaw, poland', 'stockholm, sweden',
          'oslo, norway', 'helsinki, finland', 'copenhagen, denmark',
          'dublin, ireland', 'lisbon, portugal', 'athens, greece'
        ];
        
        const aIsMajor = majorCities.some(city => city === a.displayName.toLowerCase());
        const bIsMajor = majorCities.some(city => city === b.displayName.toLowerCase());
        
        if (aIsMajor && !bIsMajor) return -1;
        if (!aIsMajor && bIsMajor) return 1;
        
        // If both or neither are major cities, prioritize by country (European/major countries first)
        const majorCountries = ['switzerland', 'france', 'germany', 'united kingdom', 'italy', 'spain', 'netherlands', 'austria'];
        const aIsMajorCountry = majorCountries.includes(a.country.toLowerCase());
        const bIsMajorCountry = majorCountries.includes(b.country.toLowerCase());
        
        if (aIsMajorCountry && !bIsMajorCountry) return -1;
        if (!aIsMajorCountry && bIsMajorCountry) return 1;
        
        // If both or neither are major cities, sort alphabetically
        return a.displayName.localeCompare(b.displayName);
      }
      
      // For non-starting matches, prioritize by how well they contain the query
      const aContainsQuery = aName.includes(queryLower);
      const bContainsQuery = bName.includes(queryLower);
      
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
    });
    
    setSuggestions(smartRanked.slice(0, 8)); // Limit to 8 final results
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