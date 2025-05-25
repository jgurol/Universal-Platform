
import { FormattedAddress } from './types';

export const formatAddress = (addressString: string): FormattedAddress | null => {
  if (!addressString) return null;
  
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    const secondPart = parts[1];
    const suitePattern = /^(suite|unit|apt|apartment|ste|floor|fl|#)\s/i;
    
    if (suitePattern.test(secondPart)) {
      const streetAddress = `${parts[0]}, ${parts[1]}`;
      const city = parts[2];
      const stateZip = parts.slice(3).join(', ');
      
      return {
        street: streetAddress,
        cityStateZip: `${city}${stateZip ? ', ' + stateZip : ''}`
      };
    } else {
      const streetAddress = parts[0];
      const city = parts[1];
      const stateZip = parts.slice(2).join(', ');
      
      return {
        street: streetAddress,
        cityStateZip: `${city}, ${stateZip}`
      };
    }
  } else if (parts.length === 2) {
    return {
      street: parts[0],
      cityStateZip: parts[1]
    };
  } else {
    return {
      street: addressString,
      cityStateZip: ''
    };
  }
};
