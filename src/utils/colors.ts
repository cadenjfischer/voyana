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

// Premium color palette - 9 carefully chosen colors that blend with dark map backgrounds
export const PREMIUM_COLOR_PALETTE = [
  { 
    id: 'slate-blue',
    name: 'Slate Blue', 
    hex: 'oklch(42% 0.06 250)', // Muted slate blue
    bg: 'bg-slate-600', 
    text: 'text-slate-100', 
    light: 'bg-slate-50', 
    border: 'border-slate-300',
    calendarBg: 'oklch(42% 0.06 250)',
    calendarText: 'oklch(95% 0.01 250)'
  },
  { 
    id: 'forest-green',
    name: 'Forest Green', 
    hex: 'oklch(40% 0.06 150)', // Deep forest green
    bg: 'bg-green-700', 
    text: 'text-green-100', 
    light: 'bg-green-50', 
    border: 'border-green-300',
    calendarBg: 'oklch(40% 0.06 150)',
    calendarText: 'oklch(95% 0.01 150)'
  },
  { 
    id: 'deep-purple',
    name: 'Deep Purple', 
    hex: 'oklch(38% 0.07 290)', // Rich deep purple
    bg: 'bg-purple-700', 
    text: 'text-purple-100', 
    light: 'bg-purple-50', 
    border: 'border-purple-300',
    calendarBg: 'oklch(38% 0.07 290)',
    calendarText: 'oklch(95% 0.01 290)'
  },
  { 
    id: 'coral-pink',
    name: 'Coral Pink', 
    hex: 'oklch(42% 0.08 20)', // Dark coral pink
    bg: 'bg-pink-700', 
    text: 'text-pink-100', 
    light: 'bg-pink-50', 
    border: 'border-pink-300',
    calendarBg: 'oklch(42% 0.08 20)',
    calendarText: 'oklch(95% 0.01 20)'
  },
  { 
    id: 'burgundy',
    name: 'Burgundy', 
    hex: 'oklch(36% 0.07 15)', // Deep burgundy wine
    bg: 'bg-red-800', 
    text: 'text-red-100', 
    light: 'bg-red-50', 
    border: 'border-red-300',
    calendarBg: 'oklch(36% 0.07 15)',
    calendarText: 'oklch(95% 0.01 15)'
  },
  { 
    id: 'navy-blue',
    name: 'Navy Blue', 
    hex: 'oklch(35% 0.06 265)', // Classic navy
    bg: 'bg-blue-900', 
    text: 'text-blue-100', 
    light: 'bg-blue-50', 
    border: 'border-blue-300',
    calendarBg: 'oklch(35% 0.06 265)',
    calendarText: 'oklch(95% 0.01 265)'
  },
  { 
    id: 'deep-teal',
    name: 'Deep Teal', 
    hex: 'oklch(38% 0.06 195)', // Ocean teal
    bg: 'bg-teal-700', 
    text: 'text-teal-100', 
    light: 'bg-teal-50', 
    border: 'border-teal-300',
    calendarBg: 'oklch(38% 0.06 195)',
    calendarText: 'oklch(95% 0.01 195)'
  },
  { 
    id: 'olive-brown',
    name: 'Olive Brown', 
    hex: 'oklch(42% 0.05 90)', // Subdued olive brown
    bg: 'bg-amber-800', 
    text: 'text-amber-100', 
    light: 'bg-amber-50', 
    border: 'border-amber-300',
    calendarBg: 'oklch(42% 0.05 90)',
    calendarText: 'oklch(95% 0.01 90)'
  },
  { 
    id: 'plum',
    name: 'Plum', 
    hex: 'oklch(37% 0.07 320)', // Deep plum
    bg: 'bg-fuchsia-800', 
    text: 'text-fuchsia-100', 
    light: 'bg-fuchsia-50', 
    border: 'border-fuchsia-300',
    calendarBg: 'oklch(37% 0.07 320)',
    calendarText: 'oklch(95% 0.01 320)'
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
  bg: 'var(--color-neutral-200)', 
  text: 'oklch(44.55% 0.0374 257.28)' 
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
export function resolveColorHex(colorId?: string, fallback: string = 'oklch(58.54% 0.2041 277.12)'): string {
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