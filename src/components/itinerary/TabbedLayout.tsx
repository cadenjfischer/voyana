'use client';

import { useState } from 'react';
import { Trip, Activity, Destination, Day, calculateNights } from '@/types/itinerary';
import TabbedDestinationRail from './TabbedDestinationRail';
import TimelineView from './TimelineView';

interface TabbedLayoutProps {
  trip: Trip;
  expandedDestinationIds: Set<string>;
  selectedDestinationId: string | null;
  activeDay: string;
  destinationRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement }>;
  onDestinationSelect: (id: string) => void;
  onDestinationToggle?: (id: string) => void;
  onDestinationsReorder: (destinations: Destination[]) => void;
  onUpdateDestination: (destination: Destination) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination: (destination: Omit<Destination, 'id' | 'order'>) => void;
  onDaysUpdate: (days: Day[]) => void;
  onDaySelect: (dayId: string) => void;
  onUpdateTrip: (trip: Trip) => void;
  onActiveTabChange?: (tab: TabType) => void;
  onOpenActivityModal?: (dayId: string, activityType: Activity['type']) => void;
}

type TabType = 'destinations' | 'day-by-day';

export default function TabbedLayout({
  trip,
  expandedDestinationIds,
  selectedDestinationId,
  activeDay,
  destinationRefs,
  onDestinationSelect,
  onDestinationToggle,
  onDestinationsReorder,
  onUpdateDestination,
  onRemoveDestination,
  onAddDestination,
  onDaysUpdate,
  onDaySelect,
  onUpdateTrip,
  onActiveTabChange,
  onOpenActivityModal,
}: TabbedLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('destinations');
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    onActiveTabChange?.(tab);
  };

  const getTotalNightsAllocated = () =>
    trip.destinations.reduce((sum, d) => sum + (d.nights || 0), 0);
  const getMaxNightsForTrip = () =>
    trip.startDate && trip.endDate ? calculateNights(trip.startDate, trip.endDate) : 0;

  return (
    <div className="flex flex-col h-full bg-static-bg-50 dark:bg-static-bg-900">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-static-gray-700 px-2 mt-2">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('destinations')}
            className={`px-6 py-2 rounded-t-md font-medium text-sm transition-all ${
              activeTab === 'destinations'
                ? 'bg-static-accent-600 border-t border-l border-r border-white/40 text-static-text-50'
                : 'bg-static-accent-800 hover:bg-static-accent-700 text-static-text-400'
            }`}
          >
            Destinations
          </button>
          <button
            onClick={() => handleTabChange('day-by-day')}
            className={`px-6 py-2 rounded-t-md font-medium text-sm transition-all ${
              activeTab === 'day-by-day'
                ? 'bg-static-accent-600 border-t border-l border-r border-white/40 text-static-text-50'
                : 'bg-static-accent-800 hover:bg-static-accent-700 text-static-text-400'
            }`}
          >
            Day by Day
          </button>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs pr-2">
          <span className="text-static-text-50">Nights allocated:</span>
          <span className="font-medium text-static-accent-600">
            {getTotalNightsAllocated()} / {getMaxNightsForTrip()}
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'destinations' ? (
          <TabbedDestinationRail
            destinations={trip.destinations}
            expandedDestinationIds={expandedDestinationIds}
            onDestinationSelect={onDestinationSelect}
            onDestinationToggle={onDestinationToggle}
            onDestinationsReorder={onDestinationsReorder}
            onUpdateDestination={onUpdateDestination}
            onRemoveDestination={onRemoveDestination}
            onAddDestination={onAddDestination}
            trip={trip}
          />
        ) : (
          <TimelineView
            trip={trip}
            activeDestinationId={selectedDestinationId || ''}
            activeDay={activeDay}
            destinationRefs={destinationRefs}
            onDaysUpdate={onDaysUpdate}
            onDaySelect={onDaySelect}
            onOpenActivityModal={onOpenActivityModal}
          />
        )}
      </div>
    </div>
  );
}
