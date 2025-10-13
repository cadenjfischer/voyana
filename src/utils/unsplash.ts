// Unsplash API integration for fetching destination photos

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  description: string | null;
  alt_description: string | null;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

// Helper function to determine season based on dates and destination type
const getSeason = (startDate?: string, endDate?: string, destination?: string): string => {
  if (!startDate) return '';
  
  const date = new Date(startDate);
  const month = date.getMonth() + 1; // 1-12
  
  // Check if it's a ski resort (winter sports destination)
  const isSkiDestination = destination?.toLowerCase().includes('ski') || 
                          destination?.toLowerCase().includes('resort') ||
                          destination?.toLowerCase().includes('mountain') ||
                          destination?.toLowerCase().includes('alps') ||
                          destination?.toLowerCase().includes('slope');
  
  // Winter months (December, January, February, March)
  if (month >= 12 || month <= 3) {
    return isSkiDestination ? 'winter snow skiing' : 'winter snow';
  }
  // Everything else (April through November)
  else {
    return isSkiDestination ? 'mountain hiking' : 'sunny';
  }
};

export const fetchDestinationPhoto = async (
  destination: string, 
  startDate?: string, 
  endDate?: string,
  randomSeed?: number
): Promise<string | null> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash access key not found');
    return null;
  }

  try {
    // Get seasonal keywords
    const seasonalKeywords = getSeason(startDate, endDate, destination);
    
    // Build search query
    let searchQuery = destination;
    if (seasonalKeywords) {
      searchQuery = `${destination} ${seasonalKeywords}`;
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data: UnsplashSearchResponse = await response.json();
    
    if (data.results.length === 0) {
      return null;
    }

    // Return single photo URL
    return data.results[0].urls.regular;
  } catch (error) {
    console.error('Error fetching photo from Unsplash:', error);
    return null;
  }
};

export const searchDestinationPhotos = async (
  destination: string, 
  perPage: number = 9,
  startDate?: string,
  endDate?: string
): Promise<string[]> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash access key not found');
    return [];
  }

  try {
    // Pure destination search - exactly like typing "Paris" into Unsplash
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data: UnsplashSearchResponse = await response.json();
    
    // Return Unsplash's top results - no filtering, no modification
    return data.results.map(photo => photo.urls.regular);
  } catch (error) {
    console.error('Error searching photos from Unsplash:', error);
    return [];
  }
};