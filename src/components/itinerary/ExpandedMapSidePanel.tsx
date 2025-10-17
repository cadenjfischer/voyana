'use client';

import { useState } from 'react';
import { Trip, Destination, Day } from '@/types/itinerary';
import TabbedDestinationRail from './TabbedDestinationRail';
import DayByDayTab from './DayByDayTab';
import SingleDayView from './SingleDayView';
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

  // Find the current day based on selectedDay index from context
  const currentDay = selectedDay !== null && selectedDay >= 0 && selectedDay < trip.days.length 
    ? trip.days[selectedDay] 
    : null;

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
        {activeTab === 'daybyday' && currentDay && selectedDay !== null && (
          <div className="h-full overflow-y-auto p-6">
            <SingleDayView
              day={currentDay}
              dayNumber={selectedDay + 1}
              onUpdateDay={(updatedDay: Day) => {
                const updatedDays = trip.days.map(d => 
                  d.id === updatedDay.id ? updatedDay : d
                );
                handleUpdateDays(updatedDays);
              }}
              onAddActivity={() => handleAddActivity(currentDay.id)}
              onDeleteActivity={(activityId: string) => {
                const updatedActivities = currentDay.activities.filter(a => a.id !== activityId);
                const updatedDay = {
                  ...currentDay,
                  activities: updatedActivities.map((activity, index) => ({ ...activity, order: index })),
                  totalCost: updatedActivities.reduce((sum, activity) => sum + activity.cost, 0)
                };
                const updatedDays = trip.days.map(d => 
                  d.id === updatedDay.id ? updatedDay : d
                );
                handleUpdateDays(updatedDays);
              }}
            />
          </div>
        )}
        {activeTab === 'daybyday' && !currentDay && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Select a day from the calendar below</p>
              <p className="text-sm mt-2">Click on any day in the calendar to view its activities</p>
            </div>
          </div>
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
