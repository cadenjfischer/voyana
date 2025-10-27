import { NormalizedFlight } from '../api/duffelClient';

/**
 * Merges and deduplicates flight results from multiple APIs
 * @param results Array of flight arrays from different APIs
 * @returns Merged, deduplicated, and sorted array of flights
 */
export function mergeFlights(results: NormalizedFlight[][]): NormalizedFlight[] {
  // 1. Combine all arrays into one
  const allFlights = results.flat();

  // 2. Create a Map to track unique flights
  const flightMap = new Map<string, NormalizedFlight>();

  for (const flight of allFlights) {
    // 3. Generate unique key based on flight details
    const key = generateFlightKey(flight);

    // 4. Check if we already have this flight
    const existing = flightMap.get(key);

    if (!existing) {
      // New flight, add it
      flightMap.set(key, flight);
    } else {
      // Duplicate found, keep the one with lower price
      if (flight.price < existing.price) {
        flightMap.set(key, flight);
      }
    }
  }

  // 5. Convert Map values back to array and sort by price
  const mergedFlights = Array.from(flightMap.values());
  
  return mergedFlights.sort((a, b) => a.price - b.price);
}

/**
 * Generates a unique key for a flight based on its core attributes
 * NOW INCLUDES: id to preserve different fare classes for the same flight
 */
function generateFlightKey(flight: NormalizedFlight): string {
  // Use the offer ID from the API to ensure we keep all fare options
  // Each fare class from Duffel/Amadeus has a unique offer ID
  return `${flight.apiSource}-${flight.id}`;
}

/**
 * Generates a route key for grouping different fare options of the same flight
 */
function generateRouteKey(flight: NormalizedFlight): string {
  // Normalize departure time to just the date and hour (ignore minutes/seconds)
  const departureDate = new Date(flight.departure);
  const normalizedDeparture = new Date(
    departureDate.getFullYear(),
    departureDate.getMonth(),
    departureDate.getDate(),
    departureDate.getHours()
  ).toISOString();

  return `${flight.carrier}-${flight.flightNumber}-${flight.origin}-${flight.destination}-${normalizedDeparture}`;
}

/**
 * Groups flight offers by route (same flight, different fare classes)
 * Returns a map where key is route, value is array of fare options
 */
export function groupOffersByRoute(flights: NormalizedFlight[]): Map<string, NormalizedFlight[]> {
  const routeMap = new Map<string, NormalizedFlight[]>();

  for (const flight of flights) {
    const routeKey = generateRouteKey(flight);
    
    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, []);
    }
    
    routeMap.get(routeKey)!.push(flight);
  }

  // Sort fare options within each route by price
  for (const [key, offers] of routeMap.entries()) {
    routeMap.set(key, offers.sort((a, b) => a.price - b.price));
  }

  return routeMap;
}

/**
 * Filters flights by various criteria
 */
export function filterFlights(
  flights: NormalizedFlight[],
  filters: {
    maxPrice?: number;
    maxStops?: number;
    preferredCarriers?: string[];
    cabinClass?: string;
  }
): NormalizedFlight[] {
  let filtered = [...flights];

  if (filters.maxPrice) {
    filtered = filtered.filter(f => f.price <= filters.maxPrice!);
  }

  if (filters.maxStops !== undefined) {
    filtered = filtered.filter(f => f.stops <= filters.maxStops!);
  }

  if (filters.preferredCarriers && filters.preferredCarriers.length > 0) {
    filtered = filtered.filter(f => 
      filters.preferredCarriers!.some(carrier => 
        f.carrier.toLowerCase().includes(carrier.toLowerCase()) ||
        f.flightNumber.toLowerCase().startsWith(carrier.toLowerCase())
      )
    );
  }

  if (filters.cabinClass) {
    filtered = filtered.filter(f => 
      f.cabinClass.toLowerCase() === filters.cabinClass!.toLowerCase()
    );
  }

  return filtered;
}

/**
 * Groups flights by various criteria for display
 */
export function groupFlights(
  flights: NormalizedFlight[],
  groupBy: 'carrier' | 'price' | 'duration' | 'stops'
): Record<string, NormalizedFlight[]> {
  const grouped: Record<string, NormalizedFlight[]> = {};

  for (const flight of flights) {
    let key: string;

    switch (groupBy) {
      case 'carrier':
        key = flight.carrier;
        break;
      case 'price':
        // Group by price ranges
        key = flight.price < 200 ? 'Under $200' :
              flight.price < 500 ? '$200-$500' :
              flight.price < 1000 ? '$500-$1000' :
              'Over $1000';
        break;
      case 'duration':
        // Group by duration ranges (in hours)
        const hours = parseDuration(flight.duration);
        key = hours < 3 ? 'Under 3h' :
              hours < 6 ? '3-6h' :
              hours < 12 ? '6-12h' :
              'Over 12h';
        break;
      case 'stops':
        key = flight.stops === 0 ? 'Non-stop' :
              flight.stops === 1 ? '1 stop' :
              `${flight.stops} stops`;
        break;
      default:
        key = 'Other';
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(flight);
  }

  return grouped;
}

/**
 * Parse ISO 8601 duration to hours
 */
function parseDuration(duration: string): number {
  // Duration format: PT2H30M
  const match = duration.match(/PT(\d+)H(\d+)?M?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  return hours + (minutes / 60);
}
