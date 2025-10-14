// Google Places API integration for destination search

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  photos?: Array<{
    photo_reference: string;
  }>;
}

export interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
}

// Debounce utility
export function createDebouncedSearch(delay: number) {
  let timeoutId: NodeJS.Timeout;
  
  return function(query: string): Promise<GooglePlace[]> {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const results = await searchGooglePlaces(query);
          resolve(results);
        } catch (error) {
          console.error('Google Places search error:', error);
          resolve([]);
        }
      }, delay);
    });
  };
}

// Search for places using our API route
export async function searchGooglePlaces(query: string): Promise<GooglePlace[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: query.trim()
    });

    const response = await fetch(`/api/places/search?${params}`);

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn(`Places API status: ${data.status}`);
      return [];
    }

    return data.results || [];
      
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

// Remove emojis from text
export function removeEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
}

// Format Google Place for display (prefer name over address)
export function formatGooglePlace(place: GooglePlace): string {
  const displayName = place.name || place.formatted_address;
  return removeEmojis(displayName);
}

// Get full formatted address (for display in search results)
export function getFormattedAddress(place: GooglePlace): string {
  return removeEmojis(place.formatted_address);
}

// Get country from Google Place
export function getCountryFromGooglePlace(place: GooglePlace): string {
  // Extract country from formatted_address
  const addressParts = place.formatted_address.split(', ');
  return addressParts[addressParts.length - 1] || '';
}

// Get place type for display
export function getGooglePlaceType(place: GooglePlace): string {
  if (place.types.includes('locality')) return 'city';
  if (place.types.includes('administrative_area_level_1')) return 'state';
  if (place.types.includes('country')) return 'country';
  if (place.types.includes('tourist_attraction')) return 'attraction';
  return 'place';
}
