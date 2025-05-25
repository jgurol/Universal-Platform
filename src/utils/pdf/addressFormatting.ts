
import { FormattedAddress } from './types';

export const formatAddress = (addressString: string): FormattedAddress | null => {
  console.log('formatAddress - Input:', {
    addressString,
    length: addressString?.length,
    type: typeof addressString
  });
  
  if (!addressString) {
    console.log('formatAddress - No address string provided, returning null');
    return null;
  }
  
  const parts = addressString.split(',').map(part => part.trim());
  console.log('formatAddress - Split parts:', parts);
  
  if (parts.length >= 3) {
    const secondPart = parts[1];
    const suitePattern = /^(suite|unit|apt|apartment|ste|floor|fl|#)\s/i;
    
    console.log('formatAddress - Checking suite pattern for second part:', secondPart);
    
    if (suitePattern.test(secondPart)) {
      const streetAddress = `${parts[0]}, ${parts[1]}`;
      const city = parts[2];
      const stateZip = parts.slice(3).join(', ');
      
      const result = {
        street: streetAddress,
        cityStateZip: `${city}${stateZip ? ', ' + stateZip : ''}`
      };
      
      console.log('formatAddress - Suite pattern result:', result);
      return result;
    } else {
      const streetAddress = parts[0];
      const city = parts[1];
      const stateZip = parts.slice(2).join(', ');
      
      const result = {
        street: streetAddress,
        cityStateZip: `${city}, ${stateZip}`
      };
      
      console.log('formatAddress - Standard 3+ parts result:', result);
      return result;
    }
  } else if (parts.length === 2) {
    const result = {
      street: parts[0],
      cityStateZip: parts[1]
    };
    
    console.log('formatAddress - 2 parts result:', result);
    return result;
  } else {
    const result = {
      street: addressString,
      cityStateZip: ''
    };
    
    console.log('formatAddress - Single part result:', result);
    return result;
  }
};
