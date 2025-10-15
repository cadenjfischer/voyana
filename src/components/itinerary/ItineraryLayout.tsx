'use client';

import { Trip } from '@/types/itinerary';
import SyncedSplitView from './SyncedSplitView';

interface ItineraryLayoutProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onActiveDay?: (dayId: string) => void;
  onDestinationMapCenterRequest?: (coords: { lat: number; lng: number } | null) => void;
}

export default function ItineraryLayout({ trip, onUpdateTrip, onActiveDay, onDestinationMapCenterRequest }: ItineraryLayoutProps) {
  return <SyncedSplitView trip={trip} onUpdateTrip={onUpdateTrip} onActiveDay={onActiveDay} onDestinationMapCenterRequest={onDestinationMapCenterRequest} />;
}