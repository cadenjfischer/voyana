'use client';

import { useState } from 'react';
import { Trip, Activity } from '@/types/itinerary';
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
  onDestinationsReorder: (destinations: any[]) => void;
  onUpdateDestination: (destination: any) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination: (destination: any) => void;
  onDaysUpdate: (days: any[]) => void;
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('destinations')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'destinations'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Destinations
          {activeTab === 'destinations' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => handleTabChange('day-by-day')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'day-by-day'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Day by Day
          {activeTab === 'day-by-day' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
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
          <div className="h-full overflow-y-auto scrollbar-hide">
            <TimelineView
              trip={trip}
              activeDestinationId={selectedDestinationId || ''}
              activeDay={activeDay}
              destinationRefs={destinationRefs}
              onDaysUpdate={onDaysUpdate}
              onDaySelect={onDaySelect}
              onOpenActivityModal={onOpenActivityModal}
            />
          </div>
        )}
      </div>
    </div>
  );
}
