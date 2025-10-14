'use client';

import { Trip } from '@/types/itinerary';
import SyncedSplitView from './SyncedSplitView';

interface ItineraryLayoutProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
}

export default function ItineraryLayout({ trip, onUpdateTrip }: ItineraryLayoutProps) {
  return <SyncedSplitView trip={trip} onUpdateTrip={onUpdateTrip} />;
}