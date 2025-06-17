
// Helper function to parse location string into address components
export const parseLocationToAddress = (location: string) => {
  // Basic parsing logic for common address formats
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    // Format: "123 Main St, City, State ZIP" or similar
    const streetAddress = parts[0];
    const city = parts[1];
    const stateZip = parts[2];
    
    // Try to extract state and zip from the last part
    const stateZipMatch = stateZip.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
    if (stateZipMatch) {
      return {
        street_address: streetAddress,
        city: city,
        state: stateZipMatch[1],
        zip_code: stateZipMatch[2]
      };
    } else {
      return {
        street_address: streetAddress,
        city: city,
        state: stateZip,
        zip_code: '00000'
      };
    }
  } else if (parts.length === 2) {
    // Format: "City, State" or "Address, City"
    return {
      street_address: parts[0],
      city: parts[1],
      state: 'Unknown',
      zip_code: '00000'
    };
  } else {
    // Single part - treat as city
    return {
      street_address: '',
      city: location,
      state: 'Unknown',
      zip_code: '00000'
    };
  }
};
