'use client';

import { Trip } from '@/types/itinerary';
import SyncedSplitView from './SyncedSplitView';
import MiniMap from '@/components/map/MiniMap';

interface ItineraryLayoutProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onRemoveDestination?: (destinationId: string) => void;
  onActiveDay?: (dayId: string) => void;
  onDestinationMapCenterRequest?: (coords: { lat: number; lng: number } | null) => void;
}

export default function ItineraryLayout({ trip, onUpdateTrip, onRemoveDestination, onActiveDay, onDestinationMapCenterRequest }: ItineraryLayoutProps) {
  return (
    <>
      <SyncedSplitView
        trip={trip}
        onUpdateTrip={onUpdateTrip}
        onRemoveDestination={onRemoveDestination}
        onActiveDay={onActiveDay}
        onDestinationMapCenterRequest={onDestinationMapCenterRequest}
      />

      {/* Always-on-top Mini Map overlay */}
      <MiniMap trip={trip} />

      {/* Debug header to verify overlay mounting order */}
      <div className="fixed bottom-2 left-2 z-[10000] bg-black text-white text-[10px] px-2 py-1 rounded shadow">
        Overlay OK
      </div>
    </>
  );
}