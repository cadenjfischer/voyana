// Core data types for the itinerary system

export interface Lodging {
  id: string;
  name: string;
  nights: number; // How many nights this lodging covers
  checkIn?: string; // Optional check-in date
  checkOut?: string; // Optional check-out date
  checkInTime?: string; // Optional check-in time
  checkOutTime?: string; // Optional check-out time
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  confirmation?: string;
  totalCost?: number;
  cost?: number; // Legacy field
  notes?: string;
}

export interface Destination {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  nights: number;
  lodging: string; // Legacy field - keep for backwards compatibility
  lodgings?: Lodging[]; // New field for multiple lodging options
  notes?: string;
  estimatedCost: number;
  order: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distanceFromPrevious?: number; // in km
  customColor?: string; // Optional custom color selected by user
}

export interface Activity {
  id: string;
  type: 'sleep' | 'do' | 'eat' | 'transport' | 'notes';
  title: string;
  description: string;
  time?: string;
  cost: number;
  location?: string;
  order: number;
  dayId: string;
  icon: string;
}

export interface Day {
  id: string;
  date: string;
  destinationId?: string; // Optional - days can be unassigned
  notes: string;
  activities: Activity[];
  totalCost: number;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  photo: string;
  startDate: string;
  endDate: string;
  destinations: Destination[];
  days: Day[];
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

// Activity type configurations
export const ACTIVITY_TYPES = {
  sleep: {
    label: 'Sleep',
    icon: '🛏️',
    color: 'blue',
    defaultTitle: 'Accommodation'
  },
  do: {
    label: 'Do',
    icon: '🎟️',
    color: 'green',
    defaultTitle: 'Activity'
  },
  eat: {
    label: 'Eat',
    icon: '🍽️',
    color: 'orange',
    defaultTitle: 'Meal'
  },
  transport: {
    label: 'Transport',
    icon: '🚆',
    color: 'purple',
    defaultTitle: 'Transportation'
  },
  notes: {
    label: 'Notes',
    icon: '📝',
    color: 'gray',
    defaultTitle: 'Notes'
  }
} as const;

// Utility functions
export const calculateTripDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const calculateNights = (startDate: string, endDate: string): number => {
  return Math.max(0, calculateTripDuration(startDate, endDate) - 1);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const generateDays = (startDate: string, endDate: string): string[] => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().split('T')[0]);
  }
  return dates;
};