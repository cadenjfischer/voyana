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
    
    // Build search query with seasonal context and fallback strategy
    let searchQuery;
    
    // For specific ski resorts or places with state/country, keep it simple
    if (destination.includes(',')) {
      const [place, region] = destination.split(',').map(s => s.trim());
      
      // Expand state abbreviations for better search results
      const stateMap: { [key: string]: string } = {
        'VT': 'Vermont', 'NY': 'New York', 'CA': 'California', 'CO': 'Colorado',
        'MT': 'Montana', 'WY': 'Wyoming', 'UT': 'Utah', 'ID': 'Idaho',
        'WA': 'Washington', 'OR': 'Oregon', 'NH': 'New Hampshire', 'ME': 'Maine',
        'MA': 'Massachusetts', 'CT': 'Connecticut', 'RI': 'Rhode Island',
        'NV': 'Nevada', 'AZ': 'Arizona', 'NM': 'New Mexico', 'TX': 'Texas',
        'FL': 'Florida', 'NC': 'North Carolina', 'SC': 'South Carolina'
      };
      
      const fullRegionName = stateMap[region] || region;
      
      // Simple search: just "Vermont Jay Peak" instead of complex queries
      searchQuery = `${fullRegionName} ${place}`;
    } else {
      // Standard search for cities/general destinations  
      searchQuery = seasonalKeywords 
        ? `${destination} ${seasonalKeywords}`
        : destination;
    }
    
    // Use search endpoint for better variety and add random page for different results
    const page = randomSeed ? (randomSeed % 10) + 1 : 1;
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&content_filter=high&per_page=30&page=${page}`,
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
    
    // Always try fallback if we have few results or if it's a specific place
    if ((data.results.length < 5 || destination.toLowerCase().includes('peak') || destination.toLowerCase().includes('resort')) && destination.includes(',')) {
      const parts = destination.split(',').map(s => s.trim());
      
      if (parts.length >= 2) {
        const region = parts[1]; // "VT"
        
        // Expand state abbreviations
        const stateMap: { [key: string]: string } = {
          'VT': 'Vermont', 'NY': 'New York', 'CA': 'California', 'CO': 'Colorado',
          'MT': 'Montana', 'WY': 'Wyoming', 'UT': 'Utah', 'ID': 'Idaho',
          'WA': 'Washington', 'OR': 'Oregon', 'NH': 'New Hampshire', 'ME': 'Maine',
          'MA': 'Massachusetts', 'CT': 'Connecticut', 'RI': 'Rhode Island',
          'NV': 'Nevada', 'AZ': 'Arizona', 'NM': 'New Mexico', 'TX': 'Texas',
          'FL': 'Florida', 'NC': 'North Carolina', 'SC': 'South Carolina'
        };
        
        const fullStateName = stateMap[region] || region;
        
        // Try multiple fallback strategies for better state-specific results
        const fallbackQueries = [
          `${fullStateName} nature`,
          `${fullStateName} mountains`,
          fullStateName
        ];
        
        for (const fallbackQuery of fallbackQueries) {
          console.log(`Trying fallback query: ${fallbackQuery}`);
          
          const fallbackResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(fallbackQuery)}&orientation=landscape&content_filter=high&per_page=30&page=1`,
            {
              headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
              },
            }
          );
          
          if (fallbackResponse.ok) {
            const fallbackData: UnsplashSearchResponse = await fallbackResponse.json();
            console.log(`Fallback query "${fallbackQuery}" returned ${fallbackData.results.length} results`);
            
            if (fallbackData.results.length > 0) {
              const randomIndex = randomSeed ? randomSeed % fallbackData.results.length : Math.floor(Math.random() * fallbackData.results.length);
              const photo = fallbackData.results[randomIndex];
              return photo.urls.regular;
            }
          }
        }
      }
    }
    
    if (data.results.length === 0) {
      return null;
    }
    
    // Pick a random photo from the results for more variety
    const randomIndex = randomSeed ? randomSeed % data.results.length : Math.floor(Math.random() * data.results.length);
    const photo = data.results[randomIndex];
    
    // Return the regular size image URL (good balance of quality and size)
    return photo.urls.regular;
  } catch (error) {
    console.error('Error fetching photo from Unsplash:', error);
    return null;
  }
};

export const searchDestinationPhotos = async (
  destination: string, 
  perPage: number = 10,
  startDate?: string,
  endDate?: string
): Promise<string[]> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash access key not found');
    return [];
  }

  try {
    // Get seasonal keywords
    const seasonalKeywords = getSeason(startDate, endDate, destination);
    
    // Build search query with seasonal context
    const baseQuery = `${destination} travel destination landscape`;
    const searchQuery = seasonalKeywords 
      ? `${baseQuery} ${seasonalKeywords}`
      : baseQuery;
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&content_filter=high&per_page=${perPage}`,
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
    
    // Return array of regular size image URLs
    return data.results.map(photo => photo.urls.regular);
  } catch (error) {
    console.error('Error searching photos from Unsplash:', error);
    return [];
  }
};