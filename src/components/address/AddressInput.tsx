
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, X } from 'lucide-react';
import { getHereMapsService, PlaceSearchResult } from '@/services/hereMapsService';
import { cn } from '@/lib/utils';

interface AddressInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onAddressSelect?: (addressData: PlaceSearchResult) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  showCoordinates?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  label = 'Address',
  placeholder = 'Enter address in Jamaica',
  value = '',
  onChange,
  onAddressSelect,
  disabled = false,
  required = false,
  error,
  className,
  showCoordinates = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const hereMapsService = getHereMapsService();
      const results = await hereMapsService.getAddressSuggestions(query);
      
      // Filter for Jamaican addresses
      const jamaicanResults = results.filter(result => 
        hereMapsService.isJamaicanAddress(result.address)
      );
      
      setSuggestions(jamaicanResults);
      setShowSuggestions(jamaicanResults.length > 0);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear coordinates when input changes
    setSelectedCoordinates(null);
    
    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);

    // Call onChange immediately for form updates
    onChange?.(newValue);
  };

  const handleSuggestionSelect = (suggestion: PlaceSearchResult) => {
    const hereMapsService = getHereMapsService();
    const formattedAddress = hereMapsService.formatAddress(suggestion.address);
    
    setInputValue(formattedAddress);
    setSelectedCoordinates(suggestion.position);
    setShowSuggestions(false);
    
    onChange?.(formattedAddress, suggestion.position);
    onAddressSelect?.(suggestion);
  };

  const clearInput = () => {
    setInputValue('');
    setSelectedCoordinates(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.('');
    inputRef.current?.focus();
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const hereMapsService = getHereMapsService();
          const results = await hereMapsService.reverseGeocode(latitude, longitude);
          
          if (results.length > 0) {
            const result = results[0];
            const formattedAddress = hereMapsService.formatAddress(result.address);
            
            setInputValue(formattedAddress);
            setSelectedCoordinates({ lat: latitude, lng: longitude });
            onChange?.(formattedAddress, { lat: latitude, lng: longitude });
            
            if (onAddressSelect) {
              onAddressSelect({
                title: result.title,
                address: result.address,
                position: result.position
              });
            }
          }
        } catch (error) {
          console.error('Error reverse geocoding location:', error);
          alert('Could not get address for your location.');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please enter address manually.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className={cn('relative space-y-2', className)}>
      {label && (
        <Label htmlFor="address-input">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-20',
            error && 'border-red-500 focus:border-red-500',
            selectedCoordinates && 'border-green-500'
          )}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
          
          {inputValue && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearInput}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={disabled || isLoading}
            className="h-6 w-6 p-0 hover:bg-gray-100"
            title="Use current location"
          >
            <MapPin className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {showCoordinates && selectedCoordinates && (
        <p className="text-xs text-gray-500">
          Coordinates: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto border shadow-lg bg-white"
        >
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => {
              const hereMapsService = getHereMapsService();
              const formattedAddress = hereMapsService.formatAddress(suggestion.address);
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formattedAddress}
                      </p>
                      {suggestion.distance && (
                        <p className="text-xs text-gray-400">
                          {Math.round(suggestion.distance)}m away
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
