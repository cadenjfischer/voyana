// Auto-generated from GeoNames data (cities15000)
// Contains destinations including cities and ski resorts
// Last updated: 2025-10-11T19:15:35.635Z

export interface Destination {
  name: string;
  country: string;
  state?: string;
  type: 'city' | 'ski-resort';
  displayName: string;
}

// Function to load destinations dynamically to avoid TypeScript compilation issues
export async function loadDestinations(): Promise<Destination[]> {
  // Import the data file dynamically
  const dataModule = await import('./destinations-data.json');
  return dataModule.default as Destination[];
}