'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ItineraryUIContextType {
  isExpanded: boolean;
  isMiniMapVisible: boolean;
  selectedDay: string | null;
  selectedDestinationId: string | null;
  setIsExpanded: (expanded: boolean) => void;
  setIsMiniMapVisible: (visible: boolean) => void;
  setSelectedDay: (day: string | null) => void;
  setSelectedDestinationId: (id: string | null) => void;
}

const ItineraryUIContext = createContext<ItineraryUIContextType | undefined>(undefined);

export function ItineraryUIProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('miniMapVisible');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  return (
    <ItineraryUIContext.Provider
      value={{
        isExpanded,
        isMiniMapVisible,
        selectedDay,
        selectedDestinationId,
        setIsExpanded,
        setIsMiniMapVisible,
        setSelectedDay,
        setSelectedDestinationId,
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
