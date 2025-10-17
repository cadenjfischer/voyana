'use client';

import { useState } from 'react';
import { Trip, Destination, Day } from '@/types/itinerary';
import TabbedDestinationRail from './TabbedDestinationRail';
import DayByDayTab from './DayByDayTab';
import AddDestinationModal from './AddDestinationModal';
import AddActivityModal from './AddActivityModal';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';

interface ExpandedMapSidePanelProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onActiveDay?: (dayId: string) => void;
  onDestinationMapCenterRequest?: (coords: { lat: number; lng: number } | null) => void;
}

export default function ExpandedMapSidePanel({
  trip,
  onUpdateTrip,
  onRemoveDestination,
  onActiveDay,
  onDestinationMapCenterRequest
}: ExpandedMapSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'destinations' | 'daybyday'>('destinations');
  const { selectedDay, setSelectedDay } = useItineraryUI();
  const [activeDestinationId, setActiveDestinationId] = useState<string>(trip.destinations[0]?.id || '');
  const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [targetDayForActivity, setTargetDayForActivity] = useState<string>('');

  const handleDestinationSelect = (id: string) => {
    setActiveDestinationId(id);
    const destination = trip.destinations.find(d => d.id === id);
    if (destination && destination.coordinates) {
      onDestinationMapCenterRequest?.(destination.coordinates);
    }
  };

  const handleDestinationsReorder = (destinations: Destination[]) => {
    onUpdateTrip({
      ...trip,
      destinations,
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateDestination = (destination: Destination) => {
    const updatedDestinations = trip.destinations.map(d => 
      d.id === destination.id ? destination : d
    );
    onUpdateTrip({
      ...trip,
      destinations: updatedDestinations,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddDestination = (destination: Omit<Destination, 'id' | 'order'>) => {
    const newDestination: Destination = {
      ...destination,
      id: Date.now().toString(),
      order: trip.destinations.length
    };
    onUpdateTrip({
      ...trip,
      destinations: [...trip.destinations, newDestination],
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateDays = (days: Day[]) => {
    onUpdateTrip({
      ...trip,
      days,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddActivity = (dayId: string) => {
    setTargetDayForActivity(dayId);
    setIsAddActivityModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Debug indicator */}
      <div className="h-2 bg-red-500"></div>
      
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('destinations')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'destinations'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Destinations
        </button>
        <button
          onClick={() => setActiveTab('daybyday')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'daybyday'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Day by Day
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'destinations' && (
          <TabbedDestinationRail
            destinations={trip.destinations}
            activeDestinationId={activeDestinationId}
            onDestinationSelect={handleDestinationSelect}
            onDestinationsReorder={handleDestinationsReorder}
            onUpdateDestination={handleUpdateDestination}
            onAddDestination={handleAddDestination}
            onRemoveDestination={onRemoveDestination}
            trip={trip}
          />
        )}
        {activeTab === 'daybyday' && (
          <DayByDayTab
            days={trip.days}
            onUpdateDays={handleUpdateDays}
            onAddActivity={handleAddActivity}
          />
        )}
      </div>

      {/* Modals */}
      {isAddDestinationModalOpen && (
        <AddDestinationModal
          isOpen={isAddDestinationModalOpen}
          onClose={() => setIsAddDestinationModalOpen(false)}
          onAddDestination={handleAddDestination}
          existingDestinations={trip.destinations}
        />
      )}

      {isAddActivityModalOpen && targetDayForActivity && (
        <AddActivityModal
          isOpen={isAddActivityModalOpen}
          onClose={() => {
            setIsAddActivityModalOpen(false);
            setTargetDayForActivity('');
          }}
          dayId={targetDayForActivity}
          onAddActivity={(activity: Omit<import('@/types/itinerary').Activity, 'id' | 'order' | 'dayId'>) => {
            const day = trip.days.find(d => d.id === targetDayForActivity);
            if (day) {
              const updatedDay = {
                ...day,
                activities: [...day.activities, { ...activity, id: Date.now().toString(), order: day.activities.length, dayId: targetDayForActivity }],
                totalCost: day.totalCost + activity.cost
              };
              handleUpdateDays(trip.days.map(d => d.id === targetDayForActivity ? updatedDay : d));
            }
            setIsAddActivityModalOpen(false);
            setTargetDayForActivity('');
          }}
        />
      )}
    </div>
  );
}
