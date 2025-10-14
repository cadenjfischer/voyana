'use client';

import { useState, useRef, useEffect } from 'react';
import { PREMIUM_COLOR_PALETTE } from '@/utils/colors';

interface ColorPickerProps {
  currentColor?: string;
  onColorSelect: (colorId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function ColorPicker({ 
  currentColor, 
  onColorSelect, 
  onClose, 
  isOpen 
}: ColorPickerProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[280px]"
      role="dialog"
      aria-label="Select destination color"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Choose Color</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close color picker"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-4 gap-2">
        {PREMIUM_COLOR_PALETTE.map((color) => (
          <button
            key={color.id}
            onClick={() => {
              onColorSelect(color.id);
              onClose();
            }}
            className={`relative w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              currentColor === color.id 
                ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ backgroundColor: color.hex }}
            aria-label={`Select ${color.name}`}
            title={color.name}
          >
            {/* Checkmark for selected color */}
            {currentColor === color.id && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-white drop-shadow-sm" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Color Names (for accessibility) */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {currentColor 
            ? PREMIUM_COLOR_PALETTE.find(c => c.id === currentColor)?.name || 'Auto Color'
            : 'Auto Color'
          }
        </p>
      </div>
    </div>
  );
}