
export interface HereApiConfig {
  apiKey: string;
  baseUrls: {
    geocoding: string;
    places: string;
    routing: string;
  };
}

export interface GeocodeResult {
  title: string;
  address: {
    label: string;
    countryCode: string;
    countryName: string;
    stateCode?: string;
    state?: string;
    county?: string;
    city?: string;
    district?: string;
    street?: string;
    houseNumber?: string;
    postalCode?: string;
  };
  position: {
    lat: number;
    lng: number;
  };
  mapView?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

export interface PlaceSearchResult {
  title: string;
  address: {
    label: string;
    countryCode: string;
    countryName: string;
    stateCode?: string;
    state?: string;
    county?: string;
    city?: string;
    district?: string;
    street?: string;
    houseNumber?: string;
    postalCode?: string;
  };
  position: {
    lat: number;
    lng: number;
  };
  categories?: Array<{
    id: string;
    name: string;
  }>;
  distance?: number;
}

const DEFAULT_CONFIG: Omit<HereApiConfig, 'apiKey'> = {
  baseUrls: {
    geocoding: 'https://geocode.search.hereapi.com/v1',
    places: 'https://discover.search.hereapi.com/v1',
    routing: 'https://router.hereapi.com/v8'
  }
};

// Jamaica bounding box for optimized searches
const JAMAICA_BOUNDS = {
  north: 18.6,
  south: 17.6,
  east: -76.0,
  west: -78.5
};

// Common Jamaican parishes for address validation
export const JAMAICAN_PARISHES = [
  'Clarendon',
  'Hanover', 
  'Kingston',
  'Manchester',
  'Portland',
  'Saint Andrew',
  'Saint Ann',
  'Saint Catherine',
  'Saint Elizabeth',
  'Saint James',
  'Saint Mary',
  'Saint Thomas',
  'Trelawny',
  'Westmoreland'
];

class HereMapsService {
  private config: HereApiConfig;

  constructor(apiKey: string, config?: Partial<HereApiConfig>) {
    this.config = {
      apiKey,
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  /**
   * Geocode an address to get coordinates and structured address data
   */
  async geocodeAddress(query: string): Promise<GeocodeResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        apiKey: this.config.apiKey,
        // Bias results towards Jamaica
        in: `bbox:${JAMAICA_BOUNDS.west},${JAMAICA_BOUNDS.south},${JAMAICA_BOUNDS.east},${JAMAICA_BOUNDS.north}`,
        limit: '10'
      });

      const response = await fetch(`${this.config.baseUrls.geocoding}/geocode?${params}`);
      
      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.items?.map((item: any) => ({
        title: item.title,
        address: item.address,
        position: item.position,
        mapView: item.mapView
      })) || [];
      
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult[]> {
    try {
      const params = new URLSearchParams({
        at: `${lat},${lng}`,
        apiKey: this.config.apiKey,
        limit: '5'
      });

      const response = await fetch(`${this.config.baseUrls.geocoding}/revgeocode?${params}`);
      
      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.items?.map((item: any) => ({
        title: item.title,
        address: item.address,
        position: item.position,
        mapView: item.mapView
      })) || [];
      
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Search for places/addresses with autocomplete
   */
  async searchPlaces(query: string, options?: {
    at?: { lat: number; lng: number };
    limit?: number;
    categories?: string[];
  }): Promise<PlaceSearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        apiKey: this.config.apiKey,
        limit: String(options?.limit || 10)
      });

      // If coordinates provided, search around that location
      if (options?.at) {
        params.append('at', `${options.at.lat},${options.at.lng}`);
      } else {
        // Default to Jamaica center
        params.append('at', '18.1096,-77.2975');
      }

      // Bias towards Jamaica
      params.append('in', `bbox:${JAMAICA_BOUNDS.west},${JAMAICA_BOUNDS.south},${JAMAICA_BOUNDS.east},${JAMAICA_BOUNDS.north}`);

      if (options?.categories?.length) {
        params.append('categories', options.categories.join(','));
      }

      const response = await fetch(`${this.config.baseUrls.places}/discover?${params}`);
      
      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.items?.map((item: any) => ({
        title: item.title,
        address: item.address,
        position: item.position,
        categories: item.categories,
        distance: item.distance
      })) || [];
      
    } catch (error) {
      console.error('Places search error:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions for address input
   */
  async getAddressSuggestions(query: string): Promise<PlaceSearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const params = new URLSearchParams({
        q: query,
        apiKey: this.config.apiKey,
        limit: '8',
        // Focus on Jamaica
        at: '18.1096,-77.2975', // Jamaica center
        in: `bbox:${JAMAICA_BOUNDS.west},${JAMAICA_BOUNDS.south},${JAMAICA_BOUNDS.east},${JAMAICA_BOUNDS.north}`
      });

      const response = await fetch(`${this.config.baseUrls.places}/autosuggest?${params}`);
      
      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.items?.filter((item: any) => item.resultType === 'place')
        .map((item: any) => ({
          title: item.title,
          address: item.address,
          position: item.position
        })) || [];
      
    } catch (error) {
      console.error('Address suggestions error:', error);
      return [];
    }
  }

  /**
   * Validate if an address is in Jamaica
   */
  isJamaicanAddress(address: any): boolean {
    return address?.countryCode === 'JAM' || 
           address?.countryName?.toLowerCase().includes('jamaica');
  }

  /**
   * Format address for display
   */
  formatAddress(address: any): string {
    const parts = [];
    
    if (address.houseNumber && address.street) {
      parts.push(`${address.houseNumber} ${address.street}`);
    } else if (address.street) {
      parts.push(address.street);
    }
    
    if (address.district && address.district !== address.city) {
      parts.push(address.district);
    }
    
    if (address.city) {
      parts.push(address.city);
    }
    
    if (address.state && JAMAICAN_PARISHES.includes(address.state)) {
      parts.push(address.state);
    }
    
    if (address.postalCode) {
      parts.push(address.postalCode);
    }
    
    if (address.countryName) {
      parts.push(address.countryName);
    }
    
    return parts.join(', ');
  }
}

// Export singleton instance
let hereMapsService: HereMapsService | null = null;

export const initializeHereMapsService = (apiKey: string): HereMapsService => {
  hereMapsService = new HereMapsService(apiKey);
  return hereMapsService;
};

export const getHereMapsService = (): HereMapsService => {
  if (!hereMapsService) {
    throw new Error('HERE Maps service not initialized. Call initializeHereMapsService first.');
  }
  return hereMapsService;
};

export default HereMapsService;
