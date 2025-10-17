'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ItineraryLayout from '@/components/itinerary/ItineraryLayout';
import AddDestinationModal from '@/components/itinerary/AddDestinationModal';
import AddActivityModal from '@/components/itinerary/AddActivityModal';
import EditTripModal from '@/components/itinerary/EditTripModal';
import ExpandableMapWidget from '@/components/map/ExpandableMapWidget';
import { Trip, Destination, Activity, generateDays } from '@/types/itinerary';
import { PREMIUM_COLOR_PALETTE } from '@/utils/colors';
import { ItineraryUIProvider } from '@/contexts/ItineraryUIContext';
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
  const [mapSelectedDay, setMapSelectedDay] = useState<any>(null);
  const [mapCenterTarget, setMapCenterTarget] = useState<{ lat: number; lng: number } | null>(null);

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

  // Function to geocode existing destinations that don't have coordinates
  const geocodeExistingDestinations = async (currentTrip: Trip, destinations: Destination[]) => {
    let updated = false;
    const updatedDestinations = [...currentTrip.destinations];
    
    for (const dest of destinations) {
      try {
        console.log('Geocoding existing destination:', dest.name);
        const response = await fetch(`/api/places/search?query=${encodeURIComponent(dest.name)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const place = data.results[0];
            const coordinates = {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            };
            
            // Update the destination in the array
            const destIndex = updatedDestinations.findIndex(d => d.id === dest.id);
            if (destIndex !== -1) {
              updatedDestinations[destIndex] = { ...updatedDestinations[destIndex], coordinates };
              updated = true;
              console.log('Updated coordinates for existing destination', dest.name, ':', coordinates);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to geocode existing destination:', dest.name, error);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (updated) {
      const updatedTrip = {
        ...currentTrip,
        destinations: updatedDestinations,
        updatedAt: new Date().toISOString()
      };
      handleUpdateTrip(updatedTrip);
    }
  };

  // Function to assign colors to destinations that don't have them
  const assignMissingColors = (currentTrip: Trip) => {
    const availableColors = PREMIUM_COLOR_PALETTE.map(color => color.id);
    const usedColors = currentTrip.destinations.map(d => d.customColor).filter(Boolean) as string[];
    let colorIndex = 0;
    let updated = false;

    const updatedDestinations = currentTrip.destinations.map(dest => {
      if (!dest.customColor) {
        // Find next available color
        let nextColor = availableColors.find(colorId => !usedColors.includes(colorId));
        if (!nextColor) {
          // All colors used, cycle through palette
          nextColor = availableColors[colorIndex % availableColors.length];
          colorIndex++;
        } else {
          usedColors.push(nextColor);
        }
        updated = true;
        console.log(`Assigning color '${nextColor}' to destination '${dest.name}'`);
        return { ...dest, customColor: nextColor };
      }
      return dest;
    });

    if (updated) {
      const updatedTrip = {
        ...currentTrip,
        destinations: updatedDestinations,
        updatedAt: new Date().toISOString()
      };
      handleUpdateTrip(updatedTrip);
      return updatedTrip;
    }
    return currentTrip;
  };

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
          
          // Check if this is a LocalTrip format (has destination string and possibly destinations array)
          const isLocalTripFormat = foundTrip.destination && typeof foundTrip.destination === 'string' && 
                                    (!foundTrip.destinations || Array.isArray(foundTrip.destinations) && foundTrip.destinations.length > 0 && typeof foundTrip.destinations[0] === 'string');
          
          if (isLocalTripFormat || (foundTrip.activities && !foundTrip.destinations)) {
            // LocalTrip format or old format - convert to new Trip format
            
            // Get destination names - prefer the destinations array if it exists, otherwise parse the destination string
            let destinationNames: string[];
            if ((foundTrip as any).destinations && Array.isArray((foundTrip as any).destinations)) {
              // Has destinations array (new LocalTrip format)
              destinationNames = (foundTrip as any).destinations;
            } else {
              // Parse from destination string (old format)
              const destinationString = foundTrip.destination || 'Main Destination';
              destinationNames = [destinationString];
              
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
            }

            // Calculate total nights for the trip
            const totalNights = Math.max(0, Math.ceil((new Date(foundTrip.endDate).getTime() - new Date(foundTrip.startDate).getTime()) / (1000 * 60 * 60 * 24)));
            
            // Helper function to get coordinates for common destinations
            const getKnownCoordinates = (name: string) => {
              const lowerName = name.toLowerCase();
              if (lowerName.includes('paris')) return { lat: 48.8566, lng: 2.3522 };
              if (lowerName.includes('nice')) return { lat: 43.7102, lng: 7.2620 };
              if (lowerName.includes('london')) return { lat: 51.5074, lng: -0.1278 };
              if (lowerName.includes('new york')) return { lat: 40.7128, lng: -74.0060 };
              if (lowerName.includes('tokyo')) return { lat: 35.6762, lng: 139.6503 };
              if (lowerName.includes('colorado')) return { lat: 39.5501, lng: -105.7821 };
              if (lowerName.includes('texas')) return { lat: 31.9686, lng: -99.9018 };
              if (lowerName.includes('california')) return { lat: 36.7783, lng: -119.4179 };
              if (lowerName.includes('florida')) return { lat: 27.6648, lng: -81.5158 };
              return undefined;
            };
            
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
                customColor: assignedColor,
                coordinates: getKnownCoordinates(name)
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
            // Already in new format - preserve existing nights
            convertedTrip = {
              ...foundTrip as Trip,
              // Ensure days array exists, regenerate if missing
              days: (foundTrip as Trip).days || generateDays(foundTrip.startDate, foundTrip.endDate).map((date, index) => ({
                id: `day-${index}`,
                date,
                destinationId: null,
                activities: [],
                notes: '',
                totalCost: 0
              }))
            };
          }
          
          setTrip(convertedTrip);
          
          // Assign colors to destinations that don't have them
          const tripWithColors = assignMissingColors(convertedTrip);
          
          // Geocode any destinations that don't have coordinates
          const destinationsNeedingCoords = tripWithColors.destinations.filter(dest => !dest.coordinates);
          if (destinationsNeedingCoords.length > 0) {
            console.log('Geocoding existing destinations without coordinates:', destinationsNeedingCoords.map(d => d.name));
            geocodeExistingDestinations(tripWithColors, destinationsNeedingCoords);
          }
        }
      }
      setLoading(false);
    }
  }, [user, tripId]);

  const handleAddDestination = async (destination: Omit<Destination, 'id' | 'order'>) => {
    if (!trip) return;

    // Auto-assign a color from the palette to ensure consistent colors
    const availableColors = PREMIUM_COLOR_PALETTE.map(color => color.id);
    const usedColors = trip.destinations
      .map(d => d.customColor)
      .filter((color): color is string => Boolean(color)); // Type-safe filter to remove undefined
    
    console.log('=== COLOR ASSIGNMENT DEBUG ===');
    console.log('Adding destination:', destination.name);
    console.log('Total existing destinations:', trip.destinations.length);
    console.log('Available colors in palette:', availableColors);
    console.log('Used colors:', usedColors);
    console.log('Existing destinations with colors:', trip.destinations.map(d => ({ 
      name: d.name, 
      color: d.customColor,
      hasColor: Boolean(d.customColor)
    })));
    
    // Find first unused color, or if all colors are used, pick the least-used one
    let nextColor: string;
    const unusedColor = availableColors.find(colorId => !usedColors.includes(colorId));
    
    if (unusedColor) {
      nextColor = unusedColor;
      console.log('Found unused color:', nextColor);
    } else {
      // All colors are used, find the least used one
      const colorCounts = new Map<string, number>();
      availableColors.forEach(color => colorCounts.set(color, 0));
      usedColors.forEach(color => {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      });
      
      // Sort by count and pick the least used
      const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => a[1] - b[1]);
      nextColor = sortedColors[0][0];
      console.log('All colors used, picking least-used:', nextColor, 'used', sortedColors[0][1], 'times');
    }
    
    console.log('Selected color for', destination.name, ':', nextColor);
    console.log('=== END DEBUG ===');

    // Always geocode the destination for map alignment - this is critical for map centering
    let coordinates;
    try {
      console.log('Geocoding destination:', destination.name);
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(destination.name)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const place = data.results[0];
          coordinates = {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          };
          console.log('Found coordinates for', destination.name, ':', coordinates);
        } else {
          console.warn('No geocoding results for:', destination.name);
        }
      } else {
        console.warn('Geocoding API error:', response.status);
      }
    } catch (error) {
      console.error('Failed to geocode destination:', destination.name, error);
    }
    
    // Post-process: if destination is a US state name, use geographic center instead of city
    if (!coordinates || (coordinates.lat > 38 && coordinates.lat < 41 && coordinates.lng > -106 && coordinates.lng < -103)) {
      const lowerName = destination.name.toLowerCase();
      if (lowerName === 'colorado' || (lowerName.includes('colorado') && !lowerName.includes('springs') && !lowerName.includes('city'))) {
        coordinates = { lat: 39.0, lng: -105.5 }; // Center of Colorado
        console.log('Adjusted coordinates to center of Colorado state:', coordinates);
      }
    }

    // If geocoding failed, try fallback coordinates for common places
    if (!coordinates) {
      const lowerName = destination.name.toLowerCase();
      if (lowerName.includes('paris')) {
        coordinates = { lat: 48.8566, lng: 2.3522 };
      } else if (lowerName.includes('nice')) {
        coordinates = { lat: 43.7102, lng: 7.2620 };
      } else if (lowerName.includes('london')) {
        coordinates = { lat: 51.5074, lng: -0.1278 };
      } else if (lowerName.includes('new york')) {
        coordinates = { lat: 40.7128, lng: -74.0060 };
      } else if (lowerName.includes('tokyo')) {
        coordinates = { lat: 35.6762, lng: 139.6503 };
      } else if (lowerName.includes('colorado') && !lowerName.includes('springs')) {
        // Center of Colorado state for better map alignment
        coordinates = { lat: 39.0, lng: -105.5 };
      } else if (lowerName.includes('california')) {
        coordinates = { lat: 36.7783, lng: -119.4179 }; // Center of California
      } else if (lowerName.includes('florida')) {
        coordinates = { lat: 27.9944, lng: -81.7603 }; // Center of Florida
      } else if (lowerName.includes('rome')) {
        coordinates = { lat: 41.9028, lng: 12.4964 };
      } else if (lowerName.includes('barcelona')) {
        coordinates = { lat: 41.3851, lng: 2.1734 };
      } else if (lowerName.includes('amsterdam')) {
        coordinates = { lat: 52.3676, lng: 4.9041 };
      }
      if (coordinates) {
        console.log('Used fallback coordinates for', destination.name, ':', coordinates);
      }
    }

    const newDestination: Destination = {
      ...destination,
      id: Date.now().toString(),
      order: trip.destinations.length,
      customColor: nextColor,
      coordinates // Always include coordinates (or undefined if geocoding failed)
    };

    console.log('NEW DESTINATION CREATED:', {
      name: newDestination.name,
      id: newDestination.id,
      customColor: newDestination.customColor,
      order: newDestination.order,
      hasCoordinates: !!newDestination.coordinates
    });

    const updatedTrip = {
      ...trip,
      destinations: [...trip.destinations, newDestination],
      updatedAt: new Date().toISOString()
    };

    console.log('UPDATED TRIP DESTINATIONS:', updatedTrip.destinations.map(d => ({
      name: d.name,
      color: d.customColor
    })));

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

  const handleRemoveDestination = (destinationId: string) => {
    if (!trip) return;

    // Filter out the destination and renumber remaining
    const filtered = trip.destinations
      .filter(d => d.id !== destinationId)
      .map((d, idx) => ({ ...d, order: idx }));

    // Unassign any days that had this destination
    const updatedDays = trip.days.map(day => ({
      ...day,
      destinationId: day.destinationId === destinationId ? undefined : day.destinationId
    }));

    const updatedTrip = {
      ...trip,
      destinations: filtered,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    };

    handleUpdateTrip(updatedTrip);
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

  const selectedDay = trip.days?.find(day => day.id === selectedDayId);

  return (
    <ItineraryUIProvider>
      <Header />
  <div className="h-screen flex flex-col overflow-hidden">
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
              onRemoveDestination={handleRemoveDestination}
              onActiveDay={(dayId) => {
                const day = trip.days.find(d => d.id === dayId);
                setMapSelectedDay(day || null);
              }}
              onDestinationMapCenterRequest={(coords: { lat: number; lng: number } | null) => {
                setMapCenterTarget(coords);
              }}
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

      {/* Expandable Map Widget */}
      <ExpandableMapWidget
        trip={trip}
        destinations={trip.destinations}
        selectedDay={mapSelectedDay}
        onDestinationClick={(destination) => {
          console.log('Destination clicked:', destination);
        }}
        onActivityClick={(activity) => {
          console.log('Activity clicked:', activity);
        }}
        centerOn={mapCenterTarget}
        onCentered={() => setTimeout(() => setMapCenterTarget(null), 300)}
        onUpdateTrip={handleUpdateTrip}
        onUpdateDestination={(updated) => {
          handleUpdateTrip({ ...trip, destinations: trip.destinations.map(d => d.id === updated.id ? updated : d), updatedAt: new Date().toISOString() });
        }}
        onRemoveDestination={(id) => {
          const filtered = trip.destinations.filter(d => d.id !== id).map((d, idx) => ({ ...d, order: idx }));
          handleUpdateTrip({ ...trip, destinations: filtered, updatedAt: new Date().toISOString() });
        }}
        onAddDestination={(dest) => {
          // Delegate to existing add flow which geocodes and assigns color
          handleAddDestination(dest);
        }}
        onDaysUpdate={(updatedDays) => {
          const updatedTrip = { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
          handleUpdateTrip(updatedTrip);
        }}
        onActiveDay={(dayId) => {
          const day = trip.days.find(d => d.id === dayId);
          setMapSelectedDay(day || null);
        }}
        onDestinationMapCenterRequest={(coords) => {
          setMapCenterTarget(coords);
        }}
      />
    </ItineraryUIProvider>
  );
}