'use client';

import { useState } from 'react';
import { Trip } from '@/types/itinerary';
import TabbedDestinationRail from './TabbedDestinationRail';
import TimelineView from './TimelineView';
import CalendarStrip from './CalendarStrip';

interface TabbedLayoutProps {
  trip: Trip;
  expandedDestinationIds: Set<string>;
  selectedDestinationId: string | null;
  activeDay: string;
  destinationRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement }>;
  onDestinationSelect: (id: string) => void;
  onDestinationsReorder: (destinations: any[]) => void;
  onUpdateDestination: (destination: any) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination: (destination: any) => void;
  onDaysUpdate: (days: any[]) => void;
  onDaySelect: (dayId: string) => void;
  onUpdateTrip: (trip: Trip) => void;
}

type TabType = 'destinations' | 'day-by-day';

export default function TabbedLayout({
  trip,
  expandedDestinationIds,
  selectedDestinationId,
  activeDay,
  destinationRefs,
  onDestinationSelect,
  onDestinationsReorder,
  onUpdateDestination,
  onRemoveDestination,
  onAddDestination,
  onDaysUpdate,
  onDaySelect,
  onUpdateTrip,
}: TabbedLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('destinations');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('destinations')}
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
          onClick={() => setActiveTab('day-by-day')}
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
            onDestinationsReorder={onDestinationsReorder}
            onUpdateDestination={onUpdateDestination}
            onRemoveDestination={onRemoveDestination}
            onAddDestination={onAddDestination}
            trip={trip}
          />
        ) : (
          <div className="flex flex-col h-full">
            {/* Calendar Strip for Day by Day */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
              <CalendarStrip
                days={trip.days}
                activeDay={activeDay}
                onDaySelect={onDaySelect}
                trip={trip}
              />
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto">
              <TimelineView
                trip={trip}
                activeDestinationId={selectedDestinationId || ''}
                activeDay={activeDay}
                destinationRefs={destinationRefs}
                onDaysUpdate={onDaysUpdate}
                onDaySelect={onDaySelect}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
