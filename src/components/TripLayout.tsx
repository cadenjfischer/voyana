'use client';

import { ReactNode } from 'react';
import TripSideHeader from './TripSideHeader';
import { Trip } from '@/types/itinerary';

interface TripLayoutProps {
  trip: Trip;
  user?: {
    email?: string | null;
  } | null;
  onEditTrip?: () => void;
  onSignOut?: () => void;
  children: ReactNode;
}

export default function TripLayout({ trip, user, onEditTrip, onSignOut, children }: TripLayoutProps) {
  return (
    <div className="flex h-screen bg-static-bg-50 dark:bg-static-bg-900">
      {/* Side Header - Single sidebar with icons and labels (112px) */}
      <TripSideHeader 
        trip={trip} 
        user={user}
        onEditTrip={onEditTrip}
        onSignOut={onSignOut}
      />
      
      {/* Main Content - offset by sidebar (112px = w-28) */}
      <main className="flex-1 h-screen overflow-hidden ml-28">
        {children}
      </main>
    </div>
  );
}
