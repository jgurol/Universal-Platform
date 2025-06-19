
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete';

interface AddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  initialValue?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const AddressAutocomplete = ({
  onAddressSelect,
  initialValue = '',
  placeholder = 'Start typing an address...',
  label = 'Address',
  required = false
}: AddressAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions, isLoading, searchAddresses, getPlaceDetails, clearSuggestions } = useAddressAutocomplete();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim().length >= 3) {
        searchAddresses(inputValue);
        setShowSuggestions(true);
      } else {
        clearSuggestions();
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchAddresses, clearSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = async (suggestion: any) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false); // Immediately hide suggestions
    setSelectedIndex(-1);
    
    const placeDetails = await getPlaceDetails(suggestion.placeId);
    if (placeDetails) {
      const { addressComponents } = placeDetails;
      
      const addressData: AddressData = {
        street_address: `${addressComponents.street_number} ${addressComponents.route}`.trim(),
        city: addressComponents.locality,
        state: addressComponents.administrative_area_level_1,
        zip_code: addressComponents.postal_code,
        country: addressComponents.country || 'United States',
      };
      
      onAddressSelect(addressData);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && inputValue.trim().length >= 3) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Only hide if focus is not moving to a suggestion button
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget;
    
    // Check if the related target is a suggestion button
    if (relatedTarget && currentTarget.contains(relatedTarget as Node)) {
      return;
    }
    
    // Delay hiding to allow for clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div className="relative space-y-2">
      <Label htmlFor="address-autocomplete" className={required ? 'required' : ''}>
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-autocomplete"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          required={required}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 border-none bg-transparent ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm">{suggestion.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
