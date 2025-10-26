'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Plane, Loader2 } from 'lucide-react';

interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  type: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (airport: Airport) => void;
  placeholder?: string;
  label: string;
  id: string;
}

export default function AirportAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'City or airport',
  label,
  id,
}: AirportAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        console.log('Fetching airports for:', value);
        const response = await fetch(`/api/airports/search?query=${encodeURIComponent(value)}`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        setSuggestions(data.places || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Airport search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (airport: Airport) => {
    onChange(airport.iataCode);
    onSelect?.(airport);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    setSelectedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-gray-900 font-semibold text-base placeholder:text-gray-400 placeholder:font-normal placeholder:normal-case transition-all"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {suggestions.map((airport, index) => (
            <button
              key={airport.iataCode}
              type="button"
              onClick={() => handleSelect(airport)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="mt-0.5 p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                <Plane className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-gray-900 text-base">
                    {airport.iataCode}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="font-semibold text-gray-700 text-sm truncate">
                    {airport.city}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {airport.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {airport.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !isLoading && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-center">
          <p className="text-sm text-gray-600">No airports found for &quot;{value}&quot;</p>
          <p className="text-xs text-gray-500 mt-1">Try a city name or airport code</p>
        </div>
      )}
    </div>
  );
}
