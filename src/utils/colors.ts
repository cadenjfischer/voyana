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
    hex: 'oklch(68.47% 0.1479 237.32)', 
    bg: 'bg-sky-500', 
    text: 'text-sky-700', 
    light: 'bg-sky-50', 
    border: 'border-sky-300',
    calendarBg: 'oklch(90.14% 0.0555 230.9)',
    calendarText: 'oklch(50.00% 0.1193 242.75)'
  },
  { 
    id: 'tropical-green',
    name: 'Tropical Green', 
    hex: 'oklch(72.27% 0.192 149.58)', 
    bg: 'bg-green-500', 
    text: 'text-green-700', 
    light: 'bg-green-50', 
    border: 'border-green-300',
    calendarBg: 'oklch(92.50% 0.0806 155.99)',
    calendarText: 'oklch(44.79% 0.1083 151.33)'
  },
  { 
    id: 'sunset-purple',
    name: 'Sunset Purple', 
    hex: 'oklch(62.68% 0.2325 303.9)', 
    bg: 'bg-purple-500', 
    text: 'text-purple-700', 
    light: 'bg-purple-50', 
    border: 'border-purple-300',
    calendarBg: 'oklch(90.24% 0.0604 306.7)',
    calendarText: 'oklch(54.13% 0.2466 293.01)'
  },
  { 
    id: 'adventure-orange',
    name: 'Adventure Orange', 
    hex: 'oklch(70.49% 0.1867 47.6)', 
    bg: 'bg-orange-500', 
    text: 'text-orange-700', 
    light: 'bg-orange-50', 
    border: 'border-orange-300',
    calendarBg: 'oklch(90.15% 0.0729 70.7)',
    calendarText: 'oklch(64.61% 0.1943 41.12)'
  },
  { 
    id: 'cherry-pink',
    name: 'Cherry Pink', 
    hex: 'oklch(65.59% 0.2118 354.31)', 
    bg: 'bg-pink-500', 
    text: 'text-pink-700', 
    light: 'bg-pink-50', 
    border: 'border-pink-300',
    calendarBg: 'oklch(82.28% 0.1095 346.02)',
    calendarText: 'oklch(52.46% 0.199 3.96)'
  },
  { 
    id: 'deep-indigo',
    name: 'Deep Indigo', 
    hex: 'oklch(58.54% 0.2041 277.12)', 
    bg: 'bg-indigo-500', 
    text: 'text-indigo-700', 
    light: 'bg-indigo-50', 
    border: 'border-indigo-300',
    calendarBg: 'oklch(86.99% 0.0622 274.04)',
    calendarText: 'oklch(45.68% 0.2146 277.02)'
  },
  { 
    id: 'ruby-red',
    name: 'Ruby Red', 
    hex: 'oklch(63.68% 0.2078 25.33)', 
    bg: 'bg-red-500', 
    text: 'text-red-700', 
    light: 'bg-red-50', 
    border: 'border-red-300',
    calendarBg: 'oklch(88.45% 0.0593 18.33)',
    calendarText: 'oklch(57.71% 0.2152 27.33)'
  },
  { 
    id: 'emerald-teal',
    name: 'Emerald Teal', 
    hex: 'oklch(70.38% 0.123 182.5)', 
    bg: 'bg-teal-500', 
    text: 'text-teal-700', 
    light: 'bg-teal-50', 
    border: 'border-teal-300',
    calendarBg: 'oklch(91.00% 0.0927 180.43)',
    calendarText: 'oklch(51.09% 0.0861 186.39)'
  },
  { 
    id: 'golden-yellow',
    name: 'Golden Yellow', 
    hex: 'oklch(79.52% 0.1617 86.05)', 
    bg: 'bg-yellow-500', 
    text: 'text-yellow-800', 
    light: 'bg-yellow-50', 
    border: 'border-yellow-300',
    calendarBg: 'oklch(90.52% 0.1657 98.11)',
    calendarText: 'oklch(55.38% 0.1207 66.44)'
  },
  { 
    id: 'wine-burgundy',
    name: 'Wine Burgundy', 
    hex: 'oklch(44.37% 0.1613 26.9)', 
    bg: 'bg-red-800', 
    text: 'text-red-100', 
    light: 'bg-red-50', 
    border: 'border-red-400',
    calendarBg: 'oklch(80.77% 0.1035 19.57)',
    calendarText: 'oklch(39.58% 0.1331 25.72)'
  },
  { 
    id: 'bronze-gold',
    name: 'Bronze Gold', 
    hex: 'oklch(68.06% 0.1423 75.83)', 
    bg: 'bg-yellow-600', 
    text: 'text-yellow-800', 
    light: 'bg-yellow-50', 
    border: 'border-yellow-400',
    calendarBg: 'oklch(86.06% 0.1731 91.94)',
    calendarText: 'oklch(55.38% 0.1207 66.44)'
  },
  { 
    id: 'navy-midnight',
    name: 'Navy Midnight', 
    hex: 'oklch(27.95% 0.0368 260.03)', 
    bg: 'bg-slate-800', 
    text: 'text-slate-100', 
    light: 'bg-slate-100', 
    border: 'border-slate-400',
    calendarBg: 'oklch(86.90% 0.0198 252.89)',
    calendarText: 'oklch(37.17% 0.0392 257.29)'
  },
  { 
    id: 'mint-fresh',
    name: 'Mint Fresh', 
    hex: 'oklch(69.59% 0.1491 162.48)', 
    bg: 'bg-emerald-500', 
    text: 'text-emerald-700', 
    light: 'bg-emerald-50', 
    border: 'border-emerald-300',
    calendarBg: 'oklch(90.49% 0.0895 164.15)',
    calendarText: 'oklch(50.81% 0.1049 165.61)'
  },
  { 
    id: 'sunset-coral',
    name: 'Sunset Coral', 
    hex: 'oklch(70.45% 0.1926 39.23)', 
    bg: 'bg-orange-600', 
    text: 'text-orange-800', 
    light: 'bg-orange-50', 
    border: 'border-orange-400',
    calendarBg: 'oklch(83.66% 0.1165 66.29)',
    calendarText: 'oklch(55.34% 0.1739 38.4)'
  },
  { 
    id: 'arctic-cyan',
    name: 'Arctic Cyan', 
    hex: 'oklch(71.48% 0.1257 215.22)', 
    bg: 'bg-cyan-500', 
    text: 'text-cyan-700', 
    light: 'bg-cyan-50', 
    border: 'border-cyan-300',
    calendarBg: 'oklch(91.67% 0.0772 205.04)',
    calendarText: 'oklch(60.89% 0.1109 221.72)'
  },
  { 
    id: 'magenta-fuchsia',
    name: 'Magenta Fuchsia', 
    hex: 'oklch(66.68% 0.2591 322.15)', 
    bg: 'bg-fuchsia-500', 
    text: 'text-fuchsia-700', 
    light: 'bg-fuchsia-50', 
    border: 'border-fuchsia-300',
    calendarBg: 'oklch(74.77% 0.207 322.16)',
    calendarText: 'oklch(51.80% 0.2258 323.95)'
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