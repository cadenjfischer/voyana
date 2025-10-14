'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ItineraryLayout from '@/components/itinerary/ItineraryLayout';
import AddDestinationModal from '@/components/itinerary/AddDestinationModal';
import AddActivityModal from '@/components/itinerary/AddActivityModal';
import EditTripModal from '@/components/itinerary/EditTripModal';
import { Trip, Destination, Activity, generateDays } from '@/types/itinerary';
import { PREMIUM_COLOR_PALETTE } from '@/utils/colors';
import Link from 'next/link';

export default function TripDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const tripId = params.id as string;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDestinationModal, setShowAddDestinationModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  // Load trip data and convert to new format if needed
  useEffect(() => {
    if (user && tripId) {
      const savedTrips = localStorage.getItem(`voyana_trips_${user.id}`);
      if (savedTrips) {
        const trips = JSON.parse(savedTrips);
        const foundTrip = trips.find((t: Trip) => t.id === tripId);
        
        if (foundTrip) {
          // Convert old format to new format if needed
          let convertedTrip: Trip;
          
          if (foundTrip.activities && !foundTrip.destinations) {
            // Old format - convert to new format
            // Parse destinations - only split if there are multiple distinct destinations
            // This handles cases like "Paris, France" (single destination) vs "Paris, France, Nice, France" (multiple destinations)
            const destinationString = foundTrip.destination || 'Main Destination';
            let destinationNames: string[] = [destinationString];
            
            // Only attempt to split if we have clear indicators of multiple destinations
            if (destinationString.includes(',')) {
              const parts = destinationString.split(',').map((name: string) => name.trim()).filter((name: string) => name.length > 0);
              
              // If we have more than 2 parts, or if parts look like complete destination names, treat as multiple
              if (parts.length > 2) {
                // Group pairs: "Paris, France, Nice, France" -> ["Paris, France", "Nice, France"]
                const groupedDestinations: string[] = [];
                for (let i = 0; i < parts.length; i += 2) {
                  if (i + 1 < parts.length) {
                    groupedDestinations.push(`${parts[i]}, ${parts[i + 1]}`);
                  } else {
                    groupedDestinations.push(parts[i]);
                  }
                }
                destinationNames = groupedDestinations;
              }
              // Otherwise keep as single destination (e.g., "Paris, France")
            }

            // Calculate total nights for the trip
            const totalNights = Math.max(0, Math.ceil((new Date(foundTrip.endDate).getTime() - new Date(foundTrip.startDate).getTime()) / (1000 * 60 * 60 * 24)));
            
            // Create separate destination objects for each city with auto-assigned colors
            const destinations = destinationNames.map((name: string, index: number) => {
              const availableColors = PREMIUM_COLOR_PALETTE.map(color => color.id);
              const assignedColor = availableColors[index % availableColors.length];
              
              return {
                id: `destination-${Date.now()}-${index}`,
                name: name,
                startDate: foundTrip.startDate,
                endDate: foundTrip.endDate,
                nights: 0, // Start all destinations with 0 nights - user assigns manually
                lodging: '',
                estimatedCost: 0,
                order: index,
                customColor: assignedColor
              };
            });

            convertedTrip = {
              id: foundTrip.id,
              title: foundTrip.title || foundTrip.name,
              description: foundTrip.description || '',
              photo: foundTrip.photo || '',
              startDate: foundTrip.startDate,
              endDate: foundTrip.endDate,
              destinations: destinations,
              days: generateDays(foundTrip.startDate, foundTrip.endDate).map((date, index) => ({
                id: `day-${index}`,
                date,
                // Don't automatically assign destinationId - let user assign manually
                notes: '',
                activities: [],
                totalCost: 0
              })),
              totalCost: 0,
              createdAt: foundTrip.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          } else {
            // Already in new format - ensure all destinations start with 0 nights
            convertedTrip = {
              ...foundTrip as Trip,
              destinations: (foundTrip as Trip).destinations.map(dest => ({
                ...dest,
                nights: 0 // Reset all nights to 0 for existing trips
              }))
            };
          }
          
          // Always ensure all destinations start with 0 nights on load
          const finalTrip = {
            ...convertedTrip,
            destinations: convertedTrip.destinations.map(dest => ({
              ...dest,
              nights: 0
            }))
          };
          setTrip(finalTrip);
        }
      }
      setLoading(false);
    }
  }, [user, tripId]);

  const handleUpdateTrip = (updatedTrip: Trip) => {
    if (user) {
      const savedTrips = localStorage.getItem(`voyana_trips_${user.id}`);
      if (savedTrips) {
        const trips = JSON.parse(savedTrips);
        const updatedTrips = trips.map((t: Trip) => t.id === tripId ? updatedTrip : t);
        localStorage.setItem(`voyana_trips_${user.id}`, JSON.stringify(updatedTrips));
        setTrip(updatedTrip);
      }
    }
  };

  const handleAddDestination = (destination: Omit<Destination, 'id' | 'order'>) => {
    if (!trip) return;

    // Auto-assign a color from the palette to ensure consistent colors
    const availableColors = PREMIUM_COLOR_PALETTE.map(color => color.id);
    const usedColors = trip.destinations.map(d => d.customColor).filter(Boolean);
    const nextColor = availableColors.find(colorId => !usedColors.includes(colorId)) || availableColors[trip.destinations.length % availableColors.length];

    const newDestination: Destination = {
      ...destination,
      id: Date.now().toString(),
      order: trip.destinations.length,
      customColor: nextColor
    };

    const updatedTrip = {
      ...trip,
      destinations: [...trip.destinations, newDestination],
      updatedAt: new Date().toISOString()
    };

    handleUpdateTrip(updatedTrip);
    setShowAddDestinationModal(false);
  };



  const handleAddActivitySubmit = (activity: Omit<Activity, 'id' | 'order' | 'dayId'>) => {
    if (!trip || !selectedDayId) return;

    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      order: 0,
      dayId: selectedDayId
    };

    const updatedDays = trip.days.map(day => {
      if (day.id === selectedDayId) {
        const updatedActivities = [...day.activities, { ...newActivity, order: day.activities.length }];
        return {
          ...day,
          activities: updatedActivities,
          totalCost: updatedActivities.reduce((sum, act) => sum + act.cost, 0)
        };
      }
      return day;
    });

    const updatedTrip = {
      ...trip,
      days: updatedDays,
      totalCost: updatedDays.reduce((sum, day) => sum + day.totalCost, 0),
      updatedAt: new Date().toISOString()
    };

    handleUpdateTrip(updatedTrip);
    setShowAddActivityModal(false);
    setSelectedDayId('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trip details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h1>
            <Link 
              href="/itinerary"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedDay = trip.days.find(day => day.id === selectedDayId);

  return (
    <>
      <Header />
      <div className="h-screen flex flex-col">
        {/* Trip Header with Edit Button */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 mt-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>{trip.destinations?.map(d => d.name).join(', ')}</span>
                <span>•</span>
                <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => setShowEditTripModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Trip
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ItineraryLayout
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        </div>
      </div>

      {/* Add Destination Modal */}
      <AddDestinationModal
        isOpen={showAddDestinationModal}
        onClose={() => setShowAddDestinationModal(false)}
        onAddDestination={handleAddDestination}
        existingDestinations={trip.destinations}
      />

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={showAddActivityModal}
        onClose={() => {
          setShowAddActivityModal(false);
          setSelectedDayId('');
        }}
        onAddActivity={handleAddActivitySubmit}
        dayId={selectedDayId}
        selectedDate={selectedDay?.date}
      />

      {/* Edit Trip Modal */}
      <EditTripModal
        isOpen={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        onUpdateTrip={handleUpdateTrip}
        trip={trip}
      />
    </>
  );
}