'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ItineraryUIContextType {
  isExpanded: boolean;
  selectedDay: number | null;
  setIsExpanded: (expanded: boolean) => void;
  setSelectedDay: (day: number | null) => void;
}

const ItineraryUIContext = createContext<ItineraryUIContextType | undefined>(undefined);

export function ItineraryUIProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <ItineraryUIContext.Provider
      value={{
        isExpanded,
        selectedDay,
        setIsExpanded,
        setSelectedDay,
      }}
    >
      {children}
    </ItineraryUIContext.Provider>
  );
}

export function useItineraryUI() {
  const context = useContext(ItineraryUIContext);
  if (context === undefined) {
    throw new Error('useItineraryUI must be used within an ItineraryUIProvider');
  }
  return context;
}
