'use client';

import { Trip } from '@/types/itinerary';
import SyncedSplitView from './SyncedSplitView';
import MiniMap from '@/components/map/MiniMap';
import { useState } from 'react';

interface ItineraryLayoutProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onActiveDay?: (dayId: string) => void;
  onDestinationMapCenterRequest?: (coords: { lat: number; lng: number } | null) => void;
}

export default function ItineraryLayout({ trip, onUpdateTrip, onRemoveDestination, onActiveDay, onDestinationMapCenterRequest }: ItineraryLayoutProps) {
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number } | null>(null);
  return (
    <>
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

      {/* Always-on-top Mini Map overlay */}
      <MiniMap trip={trip} centerOn={centerOn} />

      {/* Debug badge removed */}
    </>
  );
}