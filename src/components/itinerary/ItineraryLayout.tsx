'use client';

import { Trip, Destination } from '@/types/itinerary';
import SyncedSplitView from './SyncedSplitView';
import MiniMap from '@/components/map/MiniMap';
import ExpandedMap from '@/components/map/ExpandedMap';
import { useState } from 'react';
import { useItineraryUI } from '@/contexts/ItineraryUIContext';

interface ItineraryLayoutProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onAddDestination?: (destination: Omit<Destination, 'id' | 'order'>) => void;
  onActiveDay?: (dayId: string) => void;
  onDestinationMapCenterRequest?: (coords: { lat: number; lng: number } | null) => void;
}

export default function ItineraryLayout(props: ItineraryLayoutProps) {
  const { trip, onUpdateTrip, onRemoveDestination, onAddDestination, onActiveDay, onDestinationMapCenterRequest } = props;
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number } | null>(null);
  const { isExpanded, selectedDestinationId, setSelectedDestinationId } = useItineraryUI();
  
  console.log('🔥 ItineraryLayout V3 - ALL PROPS:', Object.keys(props));
  console.log('🔥 ItineraryLayout V3 - onAddDestination:', !!onAddDestination, typeof onAddDestination);
  
  return (
    <>
      {!isExpanded && (
        <SyncedSplitView
          trip={trip}
          onUpdateTrip={onUpdateTrip}
          onRemoveDestination={onRemoveDestination}
          onActiveDay={onActiveDay}
          onDestinationMapCenterRequest={(coords) => {
            setCenterOn(coords || null);
            onDestinationMapCenterRequest?.(coords);
          }}
        />
      )}

      {/* Always-on-top Mini Map overlay */}
      {!isExpanded && <MiniMap trip={trip} centerOn={centerOn} />}
      {isExpanded && (
        <ExpandedMap 
          trip={trip} 
          onUpdateTrip={onUpdateTrip} 
          onRemoveDestination={onRemoveDestination} 
          onAddDestination={(dest) => {
            console.log('ItineraryLayout onAddDestination called with:', dest);
            onAddDestination?.(dest);
          }}
        />
      )}

      {/* Debug badge removed */}
    </>
  );
}