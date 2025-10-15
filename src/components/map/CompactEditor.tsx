'use client';

import React from 'react';
import { Trip, Destination, Day } from '@/types/itinerary';
import { PREMIUM_COLOR_PALETTE, resolveColorHex } from '@/utils/colors';

interface CompactEditorProps {
  trip: Trip;
  destinations: Destination[];
  selectedDay?: Day | null;
  onUpdateDestination?: (destination: Destination) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination?: (destination: Omit<Destination, 'id' | 'order'>) => void;
  onDestinationClick?: (destination: Destination) => void;
}

export default function CompactEditor({ trip, destinations, selectedDay, onUpdateDestination, onRemoveDestination, onAddDestination, onDestinationClick }: CompactEditorProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Trip Overview</h4>
            <div className="text-xs text-gray-500">{destinations.length} destinations • {selectedDay ? new Date(selectedDay.date).toLocaleDateString() : 'No day selected'}</div>
          </div>
          <div>
            <button
              onClick={() => onAddDestination && onAddDestination({ name: 'New Destination', nights: 0, lodging: '', estimatedCost: 0, startDate: trip.startDate, endDate: trip.endDate })}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Calendar is rendered in the expanded overlay's bottom strip; not here */}

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {destinations.map((destination, idx) => (
            <div key={destination.id} className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onDestinationClick?.(destination)}>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: resolveColorHex(destination.customColor, '#6366f1')
                  }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{destination.name}</div>
                  <div className="text-xs text-gray-500">{destination.nights} nights</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => onUpdateDestination && onUpdateDestination({ ...destination, nights: Math.max(0, destination.nights - 1) })} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">−</button>
                <div className="min-w-[20px] text-center">{destination.nights}</div>
                <button onClick={() => onUpdateDestination && onUpdateDestination({ ...destination, nights: destination.nights + 1 })} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">+</button>
                <button onClick={() => { if (confirm('Remove destination?')) onRemoveDestination && onRemoveDestination(destination.id); }} className="ml-2 text-sm text-red-600">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
