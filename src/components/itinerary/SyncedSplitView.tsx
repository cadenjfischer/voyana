'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';
import { Trip, Destination, Day, Activity, formatDate } from '@/types/itinerary';
import { PREMIUM_COLOR_PALETTE } from '@/utils/colors';
import TabbedDestinationRail from './TabbedDestinationRail';
import TimelineView from './TimelineView';
import CalendarStrip from './CalendarStrip';
import FloatingAddButton from './FloatingAddButton';

interface SyncedSplitViewProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onActiveDay?: (dayId: string) => void;
  onDestinationMapCenterRequest?: (coords: { lat: number; lng: number } | null) => void;
}

export default function SyncedSplitView({ trip, onUpdateTrip, onRemoveDestination, onActiveDay, onDestinationMapCenterRequest }: SyncedSplitViewProps) {
  const [activeDestinationId, setActiveDestinationId] = useState<string>('');
  const [activeDay, setActiveDay] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const { selectedDestinationId, setSelectedDestinationId, selectedDay, setSelectedDay } = useItineraryUI();
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const destinationRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const manualSelectionRef = useRef<boolean>(false);
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize/sync active destination and day with shared context
  useEffect(() => {
    if (trip.destinations.length > 0) {
      const firstId = trip.destinations[0].id;
      const targetId = selectedDestinationId || activeDestinationId || firstId;
      if (activeDestinationId !== targetId) setActiveDestinationId(targetId);
      if (!selectedDestinationId) setSelectedDestinationId(targetId);
    }
    if (trip.days.length > 0) {
      const firstDayId = trip.days[0].id;
      const targetDay = selectedDay || activeDay || firstDayId;
      if (activeDay !== targetDay) setActiveDay(targetDay);
      if (!selectedDay) {
        setSelectedDay(targetDay);
        onActiveDay?.(targetDay);
      }
    }
  }, [trip.destinations, trip.days, selectedDestinationId, selectedDay]);

  // Auto-assign days to destinations - only when night counts change, not order changes
  useEffect(() => {
    if (trip.destinations.length > 0 && trip.days.length > 0) {
      const sortedDestinations = [...trip.destinations].sort((a, b) => a.order - b.order);
      let dayIndex = 0;
      
      const updatedDays = trip.days.map(day => ({ ...day, destinationId: undefined as string | undefined }));
      
      for (let destIndex = 0; destIndex < sortedDestinations.length; destIndex++) {
        const destination = sortedDestinations[destIndex];
        
        if (destination.nights === 0) {
          // Skip destinations with 0 nights - they get no days
          continue;
        }
        
        const isLastDestination = destIndex === sortedDestinations.length - 1;
        
        // Check if there are any subsequent destinations with nights > 0
        const hasActiveNextDestination = sortedDestinations.slice(destIndex + 1).some(dest => dest.nights > 0);
        
        if (hasActiveNextDestination) {
          // Non-last destinations get only their nights when there's an active destination after them
          for (let i = 0; i < destination.nights && dayIndex < updatedDays.length; i++) {
            updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
            dayIndex++;
          }
        } else {
          // Last active destination gets nights + 1 (includes departure day since no active transfer needed)
          for (let i = 0; i < destination.nights + 1 && dayIndex < updatedDays.length; i++) {
            updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
            dayIndex++;
          }
        }
      }
      
      // Only update if day assignments actually changed
      const dayAssignmentsChanged = updatedDays.some((updatedDay, index) => 
        updatedDay.destinationId !== trip.days[index].destinationId
      );
      
      if (dayAssignmentsChanged) {
        onUpdateTrip({
          ...trip,
          days: updatedDays,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }, [
    // Only trigger on night count changes, not order changes
    trip.destinations.map(d => `${d.id}:${d.nights}`).join(','),
    trip.days.length,
    onUpdateTrip
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Navigate to next day
          if (trip.days.length > 0) {
            const currentIndex = trip.days.findIndex(d => d.id === activeDay);
            const nextIndex = (currentIndex + 1) % trip.days.length;
            const nextDay = trip.days[nextIndex];
            handleDaySelect(nextDay.id);
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          // Navigate to previous day
          if (trip.days.length > 0) {
            const currentIndex = trip.days.findIndex(d => d.id === activeDay);
            const prevIndex = currentIndex === 0 ? trip.days.length - 1 : currentIndex - 1;
            const prevDay = trip.days[prevIndex];
            handleDaySelect(prevDay.id);
          }
          break;
          
        case 'ArrowLeft':
          e.preventDefault();
          // Navigate to previous destination
          if (trip.destinations.length > 0) {
            const currentIndex = trip.destinations.findIndex(d => d.id === activeDestinationId);
            const prevIndex = currentIndex === 0 ? trip.destinations.length - 1 : currentIndex - 1;
            const prevDestination = trip.destinations[prevIndex];
            handleDestinationSelect(prevDestination.id);
          }
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          // Navigate to next destination
          if (trip.destinations.length > 0) {
            const currentIndex = trip.destinations.findIndex(d => d.id === activeDestinationId);
            const nextIndex = (currentIndex + 1) % trip.destinations.length;
            const nextDestination = trip.destinations[nextIndex];
            handleDestinationSelect(nextDestination.id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [trip.days, trip.destinations, activeDay, activeDestinationId]);

  // Sync timeline scroll to destination selection
  const scrollToDestination = useCallback((destinationId: string) => {
    if (!timelineRef.current || isScrolling) return;
    
    const firstDay = trip.days.find(day => 
      trip.destinations.find(dest => dest.id === destinationId)
    );
    
    if (firstDay && destinationRefs.current[firstDay.id]) {
      setIsScrolling(true);
      destinationRefs.current[firstDay.id].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      setTimeout(() => setIsScrolling(false), 800);
    }
  }, [trip.days, trip.destinations, isScrolling]);

  // Handle destination selection
  const handleDestinationSelect = (destinationId: string) => {
    const destination = trip.destinations.find(d => d.id === destinationId);
    setActiveDestinationId(destinationId);
    setSelectedDestinationId(destinationId);
    // Request the parent to center the map on this destination instead of scrolling
    if (destination && destination.coordinates) {
      onDestinationMapCenterRequest?.({ lat: destination.coordinates.lat, lng: destination.coordinates.lng });
    } else {
      onDestinationMapCenterRequest?.(null);
    }
  };

  // Handle timeline scroll to update active destination
  const handleTimelineScroll = useCallback(() => {
    if (isScrolling || !timelineRef.current || manualSelectionRef.current) return;

    const scrollTop = timelineRef.current.scrollTop;
    // Use the same detection point as where clicks scroll to: top + 20px offset
    const detectionPoint = scrollTop + 20;

    let closestDay = '';
    let closestDistance = Infinity;

    Object.entries(destinationRefs.current).forEach(([dayId, element]) => {
      if (element) {
        const elementTop = element.offsetTop - timelineRef.current!.offsetTop;
        const distance = Math.abs(elementTop - detectionPoint);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestDay = dayId;
        }
      }
    });

    if (closestDay && closestDay !== activeDay) {
      setActiveDay(closestDay);
      onActiveDay?.(closestDay);
      
      // Find corresponding destination
      const day = trip.days.find(d => d.id === closestDay);
      if (day && day.destinationId && day.destinationId !== activeDestinationId) {
        setActiveDestinationId(day.destinationId);
      }
    }
  }, [isScrolling, activeDay, activeDestinationId, trip.days]);

  // Handle calendar day selection
  const handleDaySelect = (dayId: string) => {
    // Prevent scroll detection from interfering with manual selection
    manualSelectionRef.current = true;
    
    // Set active day immediately for responsive UI
  setActiveDay(dayId);
  setSelectedDay(dayId);
    onActiveDay?.(dayId);
    
    // Find corresponding destination and set it active
    const day = trip.days.find(d => d.id === dayId);
    if (day && day.destinationId && day.destinationId !== activeDestinationId) {
      setActiveDestinationId(day.destinationId);
      setSelectedDestinationId(day.destinationId);
    }
    
    // Scroll to the day in the timeline
    if (destinationRefs.current[dayId] && timelineRef.current) {
      setIsScrolling(true);
      const element = destinationRefs.current[dayId];
      const container = timelineRef.current;
      
      // Get the element and container positions
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calculate the scroll position needed to put element at top of container
      // Current scroll + element position relative to container - small offset
      const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - 20;
      
      // Use scrollTo on the container only, not scrollIntoView
      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
      
      // Re-enable scroll detection after animation completes
      setTimeout(() => {
        setIsScrolling(false);
        manualSelectionRef.current = false;
      }, 1200);
    } else {
      // Re-enable scroll detection immediately if no scroll needed
      manualSelectionRef.current = false;
    }
  };

  // Update destination order
  const handleDestinationReorder = useCallback((reorderedDestinations: Destination[]) => {
    // Reassign days immediately based on new destination order
    const sortedDestinations = [...reorderedDestinations].sort((a, b) => a.order - b.order);
    let dayIndex = 0;
    
    const updatedDays = trip.days.map(day => ({ ...day, destinationId: undefined as string | undefined }));
    
    for (let destIndex = 0; destIndex < sortedDestinations.length; destIndex++) {
      const destination = sortedDestinations[destIndex];
      
      if (destination.nights === 0) {
        // Skip destinations with 0 nights - they get no days
        continue;
      }
      
      const isLastDestination = destIndex === sortedDestinations.length - 1;
      
      // Check if there are any subsequent destinations with nights > 0
      const hasActiveNextDestination = sortedDestinations.slice(destIndex + 1).some(dest => dest.nights > 0);
      
      if (hasActiveNextDestination) {
        // Non-last destinations get only their nights when there's an active destination after them
        for (let i = 0; i < destination.nights && dayIndex < updatedDays.length; i++) {
          updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
          dayIndex++;
        }
      } else {
        // Last active destination gets nights + 1 (includes departure day since no active transfer needed)
        for (let i = 0; i < destination.nights + 1 && dayIndex < updatedDays.length; i++) {
          updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
          dayIndex++;
        }
      }
    }
    
    onUpdateTrip({
      ...trip,
      destinations: reorderedDestinations,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  }, [trip, onUpdateTrip]);

  // Update days
  const handleDaysUpdate = (updatedDays: Day[]) => {
    const totalCost = updatedDays.reduce((sum, day) => sum + day.totalCost, 0);
    onUpdateTrip({
      ...trip,
      days: updatedDays,
      totalCost,
      updatedAt: new Date().toISOString()
    });
  };

  // Handle destination updates (e.g., night count changes)
  const handleDestinationUpdate = useCallback((updatedDestination: Destination) => {
    // Update destinations immediately for fast UI feedback
    const updatedDestinations = trip.destinations.map(dest => 
      dest.id === updatedDestination.id ? updatedDestination : dest
    );
    
    // Auto-assign days based on nights and visit order
    const sortedDestinations = [...updatedDestinations].sort((a, b) => a.order - b.order);
    let dayIndex = 0;
    
    const updatedDays = trip.days.map(day => ({ ...day, destinationId: undefined as string | undefined }));
    
    for (let destIndex = 0; destIndex < sortedDestinations.length; destIndex++) {
      const destination = sortedDestinations[destIndex];
      
      if (destination.nights === 0) {
        // Skip destinations with 0 nights - they get no days
        continue;
      }
      
      const isLastDestination = destIndex === sortedDestinations.length - 1;
      
      // Check if there are any subsequent destinations with nights > 0
      const hasActiveNextDestination = sortedDestinations.slice(destIndex + 1).some(dest => dest.nights > 0);
      
      if (hasActiveNextDestination) {
        // Non-last destinations get only their nights when there's an active destination after them
        for (let i = 0; i < destination.nights && dayIndex < updatedDays.length; i++) {
          updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
          dayIndex++;
        }
      } else {
        // Last active destination gets nights + 1 (includes departure day since no active transfer needed)
        for (let i = 0; i < destination.nights + 1 && dayIndex < updatedDays.length; i++) {
          updatedDays[dayIndex] = { ...updatedDays[dayIndex], destinationId: destination.id };
          dayIndex++;
        }
      }
    }
    
    onUpdateTrip({
      ...trip,
      destinations: updatedDestinations,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  }, [trip, onUpdateTrip]);

  // Handle adding new destination
  const handleAddDestination = useCallback(async (destinationData: Omit<Destination, 'id' | 'order'>) => {
    // Auto-assign a color from the palette to ensure unique colors
    const availableColors = PREMIUM_COLOR_PALETTE.map(color => color.id);
    const usedColors = trip.destinations
      .map(d => d.customColor)
      .filter((color): color is string => Boolean(color));
    
    // Find first unused color, or if all colors are used, pick the least-used one
    let assignedColor: string;
    const unusedColor = availableColors.find(colorId => !usedColors.includes(colorId));
    
    if (unusedColor) {
      assignedColor = unusedColor;
    } else {
      // All colors are used, find the least used one
      const colorCounts = new Map<string, number>();
      availableColors.forEach(color => colorCounts.set(color, 0));
      usedColors.forEach(color => {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      });
      const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => a[1] - b[1]);
      assignedColor = sortedColors[0][0];
    }

    // Geocode the destination for map alignment
    let coordinates;
    try {
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(destinationData.name)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const place = data.results[0];
          coordinates = {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          };
          console.log('Geocoded', destinationData.name, ':', coordinates);
        }
      }
    } catch (error) {
      console.warn('Failed to geocode destination:', destinationData.name, error);
    }

    const newDestination: Destination = {
      ...destinationData,
      id: crypto.randomUUID(),
      order: trip.destinations.length,
      customColor: assignedColor,
      coordinates
    };

    console.log('SyncedSplitView: Adding destination with color:', {
      name: newDestination.name,
      color: assignedColor,
      hasCoordinates: !!coordinates
    });

    const updatedDestinations = [...trip.destinations, newDestination];

    onUpdateTrip({
      ...trip,
      destinations: updatedDestinations,
      updatedAt: new Date().toISOString()
    });

    // Set the new destination as active
    setActiveDestinationId(newDestination.id);
  }, [trip, onUpdateTrip]);

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Screen reader live region */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" />
        
        {/* Mobile: Destination chips at top */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div 
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            role="tablist"
            aria-label="Trip destinations"
          >
            {trip.destinations.map((destination) => (
              <button
                key={destination.id}
                role="tab"
                aria-selected={activeDestinationId === destination.id}
                aria-controls={`timeline-${destination.id}`}
                tabIndex={activeDestinationId === destination.id ? 0 : -1}
                onClick={() => handleDestinationSelect(destination.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeDestinationId === destination.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {destination.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Calendar Strip */}
        <div className="z-20 bg-white border-b border-gray-200">
          <CalendarStrip
            days={trip.days}
            activeDay={activeDay}
            onDaySelect={handleDaySelect}
            trip={trip}
          />
        </div>

        {/* Scrollable Timeline */}
        <div 
          ref={timelineRef}
          className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
          onScroll={handleTimelineScroll}
        >
          <TimelineView
            trip={trip}
            activeDestinationId={activeDestinationId}
            activeDay={activeDay}
            destinationRefs={destinationRefs}
            onDaysUpdate={handleDaysUpdate}
            onDaySelect={handleDaySelect}
          />
        </div>

        {/* Floating Add Button */}
        <FloatingAddButton
          trip={trip}
          activeDestinationId={activeDestinationId}
          activeDay={activeDay}
          onUpdateTrip={onUpdateTrip}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Screen reader live region for desktop */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />
      
      {/* Desktop: Left Pane - Destinations Rail (35%) */}
      <div className="w-[35%] border-r border-gray-200 flex flex-col bg-white">
        <TabbedDestinationRail
          destinations={trip.destinations}
          activeDestinationId={activeDestinationId}
          onDestinationSelect={handleDestinationSelect}
          onDestinationsReorder={handleDestinationReorder}
          onUpdateDestination={handleDestinationUpdate}
          onRemoveDestination={onRemoveDestination}
          onAddDestination={handleAddDestination}
          trip={trip}
        />
      </div>

      {/* Desktop: Right Pane - Timeline (65%) */}
      <div className="w-[65%] flex flex-col">
        {/* Fixed Calendar Strip */}
        <div className="z-20 bg-white border-b border-gray-200">
          <CalendarStrip
            days={trip.days}
            activeDay={activeDay}
            onDaySelect={handleDaySelect}
            trip={trip}
          />
        </div>

        {/* Scrollable Timeline - Vertical */}
        <div 
          ref={timelineRef}
          className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
          onScroll={handleTimelineScroll}
        >
          <TimelineView
            trip={trip}
            activeDestinationId={activeDestinationId}
            activeDay={activeDay}
            destinationRefs={destinationRefs}
            onDaysUpdate={handleDaysUpdate}
            onDaySelect={handleDaySelect}
          />
        </div>

        {/* Floating Add Button */}
        <FloatingAddButton
          trip={trip}
          activeDestinationId={activeDestinationId}
          activeDay={activeDay}
          onUpdateTrip={onUpdateTrip}
        />
      </div>
    </div>
  );
}