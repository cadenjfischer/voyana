'use client';

import { ReactNode } from 'react';
import TripSideHeader from './TripSideHeader';
import { Trip } from '@/types/itinerary';

type TabType = 'plan' | 'discover' | 'budget' | 'flights' | 'hotels';

interface TripLayoutProps {
  trip: Trip;
  user?: {
    email?: string | null;
  } | null;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  onEditTrip?: () => void;
  onSignOut?: () => void;
  children: ReactNode;
}

export default function TripLayout({ 
  trip, 
  user, 
  activeTab,
  onTabChange,
  onEditTrip, 
  onSignOut, 
  children 
}: TripLayoutProps) {
  return (
    <div className="flex h-screen bg-static-bg-50 dark:bg-static-bg-900">
      {/* Side Header - Single sidebar with icons and labels (112px) */}
      <TripSideHeader 
        trip={trip} 
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onEditTrip={onEditTrip}
        onSignOut={onSignOut}
      />
      
      {/* Main Content - offset by sidebar (112px = w-28) */}
      <main className="flex-1 h-screen overflow-y-auto ml-28">
        {children}
      </main>
    </div>
  );
}
