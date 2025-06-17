
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

// Jamaica center coordinates
const JAMAICA_CENTER = {
  lat: 18.1096,
  lng: -77.2975
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
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Valid HERE Maps API key is required');
    }

    this.config = {
      apiKey: apiKey.trim(),
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  /**
   * Validate API key format (basic validation)
   */
  private validateApiKey(): boolean {
    const apiKey = this.config.apiKey;
    // HERE API keys are typically alphanumeric with hyphens and underscores
    const keyPattern = /^[A-Za-z0-9_-]+$/;
    return keyPattern.test(apiKey) && apiKey.length >= 20;
  }

  /**
   * Format coordinates for HERE API
   */
  private formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)},${lng.toFixed(6)}`;
  }

  /**
   * Format bounding box for HERE API
   */
  private formatBoundingBox(bounds: typeof JAMAICA_BOUNDS): string {
    return `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
  }

  /**
   * Make HTTP request with error handling
   */
  private async makeRequest(url: string): Promise<any> {
    console.log('HERE Maps API Request:', url);
    
    if (!this.validateApiKey()) {
      throw new Error('Invalid API key format. Please check your HERE Maps API key.');
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('HERE Maps API Response Status:', response.status);

      if (!response.ok) {
        let errorMessage = `HERE API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('HERE Maps API Error Details:', errorData);
          
          if (errorData.error) {
            errorMessage = `HERE API error: ${errorData.error.title || errorData.error.message || errorMessage}`;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('HERE Maps API Response Data:', data);
      return data;
      
    } catch (error) {
      console.error('HERE Maps request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to HERE Maps API. Please check your internet connection.');
      }
      throw error;
    }
  }

  /**
   * Geocode an address to get coordinates and structured address data
   */
  async geocodeAddress(query: string): Promise<GeocodeResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query parameter is required for geocoding');
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        apiKey: this.config.apiKey,
        limit: '10',
        // Use 'in' parameter for country restriction (more reliable than bbox)
        in: `countryCode:JAM`
      });

      // Add Jamaica bounding box as additional bias
      params.append('bias', this.formatCoordinates(JAMAICA_CENTER.lat, JAMAICA_CENTER.lng));

      const url = `${this.config.baseUrls.geocoding}/geocode?${params}`;
      const data = await this.makeRequest(url);
      
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
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Valid latitude and longitude are required for reverse geocoding');
    }

    try {
      const params = new URLSearchParams({
        at: this.formatCoordinates(lat, lng),
        apiKey: this.config.apiKey,
        limit: '5'
      });

      const url = `${this.config.baseUrls.geocoding}/revgeocode?${params}`;
      const data = await this.makeRequest(url);
      
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
    if (!query || query.trim().length === 0) {
      throw new Error('Query parameter is required for places search');
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        apiKey: this.config.apiKey,
        limit: String(options?.limit || 10)
      });

      // Set search location
      if (options?.at) {
        params.append('at', this.formatCoordinates(options.at.lat, options.at.lng));
      } else {
        params.append('at', this.formatCoordinates(JAMAICA_CENTER.lat, JAMAICA_CENTER.lng));
      }

      // Restrict to Jamaica
      params.append('in', 'countryCode:JAM');

      if (options?.categories?.length) {
        params.append('categories', options.categories.join(','));
      }

      const url = `${this.config.baseUrls.places}/discover?${params}`;
      const data = await this.makeRequest(url);
      
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
        q: query.trim(),
        apiKey: this.config.apiKey,
        limit: '8',
        at: this.formatCoordinates(JAMAICA_CENTER.lat, JAMAICA_CENTER.lng),
        in: 'countryCode:JAM'
      });

      const url = `${this.config.baseUrls.places}/autosuggest?${params}`;
      const data = await this.makeRequest(url);
      
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

export const isHereMapsServiceInitialized = (): boolean => {
  return hereMapsService !== null;
};

export default HereMapsService;
