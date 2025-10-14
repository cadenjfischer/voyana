// Auto-generated from GeoNames data (cities15000)
// Contains destinations including cities and ski resorts

export interface Destination {
  name: string;
  country: string;
  state?: string;
  type: 'city' | 'ski-resort' | 'country' | 'state';
  displayName: string;
}

// Import destinations data from JSON
import * as destinationsData from './destinations-data.json';

export const destinations: Destination[] = (destinationsData as { default?: Destination[] } & Destination[]).default || destinationsData;