// Shared color utility for consistent destination colors across all components

export interface DestinationColors {
  bg: string;
  text: string;
  light: string;
  border: string;
}

export interface CalendarColors {
  bg: string;
  text: string;
}

// Premium but fun color palette - carefully chosen for travel vibes and accessibility
export const PREMIUM_COLOR_PALETTE = [
  { 
    id: 'ocean-blue',
    name: 'Ocean Blue', 
    hex: '#0ea5e9', 
    bg: 'bg-sky-500', 
    text: 'text-sky-700', 
    light: 'bg-sky-50', 
    border: 'border-sky-300',
    calendarBg: '#bae6fd',
    calendarText: '#0369a1'
  },
  { 
    id: 'tropical-green',
    name: 'Tropical Green', 
    hex: '#22c55e', 
    bg: 'bg-green-500', 
    text: 'text-green-700', 
    light: 'bg-green-50', 
    border: 'border-green-300',
    calendarBg: '#bbf7d0',
    calendarText: '#166534'
  },
  { 
    id: 'sunset-purple',
    name: 'Sunset Purple', 
    hex: '#a855f7', 
    bg: 'bg-purple-500', 
    text: 'text-purple-700', 
    light: 'bg-purple-50', 
    border: 'border-purple-300',
    calendarBg: '#e9d5ff',
    calendarText: '#7c3aed'
  },
  { 
    id: 'adventure-orange',
    name: 'Adventure Orange', 
    hex: '#f97316', 
    bg: 'bg-orange-500', 
    text: 'text-orange-700', 
    light: 'bg-orange-50', 
    border: 'border-orange-300',
    calendarBg: '#fed7aa',
    calendarText: '#ea580c'
  },
  { 
    id: 'cherry-pink',
    name: 'Cherry Pink', 
    hex: '#ec4899', 
    bg: 'bg-pink-500', 
    text: 'text-pink-700', 
    light: 'bg-pink-50', 
    border: 'border-pink-300',
    calendarBg: '#f9a8d4',
    calendarText: '#be185d'
  },
  { 
    id: 'deep-indigo',
    name: 'Deep Indigo', 
    hex: '#6366f1', 
    bg: 'bg-indigo-500', 
    text: 'text-indigo-700', 
    light: 'bg-indigo-50', 
    border: 'border-indigo-300',
    calendarBg: '#c7d2fe',
    calendarText: '#4338ca'
  },
  { 
    id: 'ruby-red',
    name: 'Ruby Red', 
    hex: '#ef4444', 
    bg: 'bg-red-500', 
    text: 'text-red-700', 
    light: 'bg-red-50', 
    border: 'border-red-300',
    calendarBg: '#fecaca',
    calendarText: '#dc2626'
  },
  { 
    id: 'emerald-teal',
    name: 'Emerald Teal', 
    hex: '#14b8a6', 
    bg: 'bg-teal-500', 
    text: 'text-teal-700', 
    light: 'bg-teal-50', 
    border: 'border-teal-300',
    calendarBg: '#99f6e4',
    calendarText: '#0f766e'
  },
  { 
    id: 'golden-yellow',
    name: 'Golden Yellow', 
    hex: '#eab308', 
    bg: 'bg-yellow-500', 
    text: 'text-yellow-800', 
    light: 'bg-yellow-50', 
    border: 'border-yellow-300',
    calendarBg: '#fde047',
    calendarText: '#a16207'
  },
  { 
    id: 'wine-burgundy',
    name: 'Wine Burgundy', 
    hex: '#991b1b', 
    bg: 'bg-red-800', 
    text: 'text-red-100', 
    light: 'bg-red-50', 
    border: 'border-red-400',
    calendarBg: '#fca5a5',
    calendarText: '#7f1d1d'
  },
  { 
    id: 'bronze-gold',
    name: 'Bronze Gold', 
    hex: '#ca8a04', 
    bg: 'bg-yellow-600', 
    text: 'text-yellow-800', 
    light: 'bg-yellow-50', 
    border: 'border-yellow-400',
    calendarBg: '#facc15',
    calendarText: '#a16207'
  },
  { 
    id: 'navy-midnight',
    name: 'Navy Midnight', 
    hex: '#1e293b', 
    bg: 'bg-slate-800', 
    text: 'text-slate-100', 
    light: 'bg-slate-100', 
    border: 'border-slate-400',
    calendarBg: '#cbd5e1',
    calendarText: '#334155'
  },
  { 
    id: 'mint-fresh',
    name: 'Mint Fresh', 
    hex: '#10b981', 
    bg: 'bg-emerald-500', 
    text: 'text-emerald-700', 
    light: 'bg-emerald-50', 
    border: 'border-emerald-300',
    calendarBg: '#a7f3d0',
    calendarText: '#047857'
  },
  { 
    id: 'sunset-coral',
    name: 'Sunset Coral', 
    hex: '#ff6b35', 
    bg: 'bg-orange-600', 
    text: 'text-orange-800', 
    light: 'bg-orange-50', 
    border: 'border-orange-400',
    calendarBg: '#fdba74',
    calendarText: '#c2410c'
  },
  { 
    id: 'arctic-cyan',
    name: 'Arctic Cyan', 
    hex: '#06b6d4', 
    bg: 'bg-cyan-500', 
    text: 'text-cyan-700', 
    light: 'bg-cyan-50', 
    border: 'border-cyan-300',
    calendarBg: '#a5f3fc',
    calendarText: '#0891b2'
  },
  { 
    id: 'magenta-fuchsia',
    name: 'Magenta Fuchsia', 
    hex: '#d946ef', 
    bg: 'bg-fuchsia-500', 
    text: 'text-fuchsia-700', 
    light: 'bg-fuchsia-50', 
    border: 'border-fuchsia-300',
    calendarBg: '#e879f9',
    calendarText: '#a21caf'
  }
];

// Legacy color palettes for backward compatibility
const COLOR_PALETTE: DestinationColors[] = PREMIUM_COLOR_PALETTE.map(color => ({
  bg: color.bg,
  text: color.text,
  light: color.light,
  border: color.border
}));

const CALENDAR_COLOR_PALETTE: CalendarColors[] = PREMIUM_COLOR_PALETTE.map(color => ({
  bg: color.calendarBg,
  text: color.calendarText
}));

const GRAY_COLORS: DestinationColors = { 
  bg: 'bg-slate-600', 
  text: 'text-slate-100', 
  light: 'bg-slate-50', 
  border: 'border-slate-400' 
};

const GRAY_CALENDAR_COLORS: CalendarColors = { 
  bg: '#e2e8f0', 
  text: '#475569' 
};

/**
 * Generate a consistent hash from a string
 */
function generateHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get consistent destination colors for components like TabbedDestinationRail and TimelineView
 */
export function getDestinationColors(
  destinationId: string, 
  destinations: Array<{ id: string; nights: number; customColor?: string }>,
  showGrayForZeroNights: boolean = false
): DestinationColors {
  const destination = destinations.find(d => d.id === destinationId);
  
  // Return gray if destination has no nights allocated (when enabled)
  if (showGrayForZeroNights && (!destination || destination.nights === 0)) {
    return GRAY_COLORS;
  }
  
  // Check for custom color first
  if (destination?.customColor) {
    const customColorData = PREMIUM_COLOR_PALETTE.find(color => color.id === destination.customColor);
    if (customColorData) {
      return {
        bg: customColorData.bg,
        text: customColorData.text,
        light: customColorData.light,
        border: customColorData.border
      };
    }
  }
  
  // Fallback to hash-based color selection
  const hash = generateHash(destinationId);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length] || COLOR_PALETTE[0];
}

/**
 * Get consistent calendar colors for CalendarStrip component
 */
export function getCalendarColors(
  destinationId: string,
  destinations: Array<{ id: string; nights: number; customColor?: string }>
): CalendarColors {
  const destination = destinations.find(d => d.id === destinationId);
  
  // Return gray if destination has no nights allocated
  if (!destination || destination.nights === 0) {
    return GRAY_CALENDAR_COLORS;
  }
  
  // Check for custom color first
  if (destination?.customColor) {
    const customColorData = PREMIUM_COLOR_PALETTE.find(color => color.id === destination.customColor);
    if (customColorData) {
      return {
        bg: customColorData.calendarBg,
        text: customColorData.calendarText
      };
    }
  }
  
  // Fallback to hash-based color selection
  const hash = generateHash(destinationId);
  return CALENDAR_COLOR_PALETTE[hash % CALENDAR_COLOR_PALETTE.length] || CALENDAR_COLOR_PALETTE[0];
}

/**
 * Check if a day is a transfer day (first day of a new destination after day 1)
 */
export function isTransferDay(
  dayIndex: number,
  days: Array<{ destinationId?: string }>,
  destinations: Array<{ id: string; nights: number; order: number }>
): boolean {
  if (dayIndex === 0) return false; // First day is arrival, not transfer
  if (dayIndex >= days.length) return false; // Invalid index
  
  const currentDay = days[dayIndex];
  const previousDay = days[dayIndex - 1];
  
  if (!currentDay.destinationId || !previousDay.destinationId) return false;
  if (currentDay.destinationId === previousDay.destinationId) return false;
  
  // This is a transfer day if we're starting a new destination (not the first day of trip)
  return true;
}

/**
 * Get calendar colors with transfer day support
 */
export function getCalendarColorsWithTransfer(
  destinationId: string,
  dayIndex: number,
  days: Array<{ destinationId?: string }>,
  destinations: Array<{ id: string; nights: number; order: number; customColor?: string }>
): CalendarColors & { isTransfer: boolean } {
  const destination = destinations.find(d => d.id === destinationId);
  
  // Return gray if destination has no nights allocated
  if (!destination || destination.nights === 0) {
    return { ...GRAY_CALENDAR_COLORS, isTransfer: false };
  }
  
  const isTransfer = isTransferDay(dayIndex, days, destinations);
  const baseColors = getCalendarColors(destinationId, destinations);
  
  if (isTransfer) {
    // Create gradient colors for transfer days (from previous to current destination)
    const previousDay = days[dayIndex - 1];
    if (previousDay && previousDay.destinationId) {
      const previousDestColors = getCalendarColors(previousDay.destinationId, destinations);
      return {
        bg: `linear-gradient(135deg, ${previousDestColors.bg} 0%, ${previousDestColors.bg} 40%, ${baseColors.bg} 100%)`,
        text: baseColors.text,
        isTransfer: true
      };
    }
  }
  
  return { ...baseColors, isTransfer };
}

/**
 * Get Tailwind CSS class for progress indicator
 */
export function getProgressIndicatorClass(
  destinationId: string,
  destinations: Array<{ id: string; nights: number; customColor?: string }>
): string {
  const destination = destinations.find(d => d.id === destinationId);
  
  // Return gray if destination has no nights allocated
  if (!destination || destination.nights === 0) {
    return 'bg-gray-500';
  }
  
  const colors = getDestinationColors(destinationId, destinations, false);
  return colors.bg;
}

/**
 * Resolve a color id (current or legacy) to a hex value.
 * Accepts the new palette ids (e.g. 'ocean-blue') or legacy short ids ('ocean','mint', etc.)
 */
export function resolveColorHex(colorId?: string, fallback: string = '#6366f1'): string {
  if (!colorId) return fallback;

  // Check current palette first
  const current = PREMIUM_COLOR_PALETTE.find(c => c.id === colorId);
  if (current && current.hex) return current.hex;

  // Map legacy short ids to palette ids
  const legacyMap: { [key: string]: string } = {
    coral: 'sunset-coral',
    ocean: 'ocean-blue',
    sunset: 'sunset-purple',
    lavender: 'sunset-purple',
    sky: 'ocean-blue',
    rose: 'cherry-pink',
    mint: 'mint-fresh',
    peach: 'sunset-coral'
  };

  const mapped = legacyMap[colorId];
  if (mapped) {
    const found = PREMIUM_COLOR_PALETTE.find(c => c.id === mapped);
    if (found && found.hex) return found.hex;
  }

  // As a last attempt, try to find any palette entry containing the colorId substring
  const fuzzy = PREMIUM_COLOR_PALETTE.find(c => c.id.includes(colorId));
  if (fuzzy && fuzzy.hex) return fuzzy.hex;

  return fallback;
}