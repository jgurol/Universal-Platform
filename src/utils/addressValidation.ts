
export interface AddressValidationError {
  field: string;
  message: string;
}

export const validateAddress = (addressData: {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}): AddressValidationError[] => {
  const errors: AddressValidationError[] = [];

  // Street address validation
  if (!addressData.street_address.trim()) {
    errors.push({ field: 'street_address', message: 'Street address is required' });
  } else if (addressData.street_address.length < 5) {
    errors.push({ field: 'street_address', message: 'Street address must be at least 5 characters' });
  }

  // City validation
  if (!addressData.city.trim()) {
    errors.push({ field: 'city', message: 'City is required' });
  } else if (addressData.city.length < 2) {
    errors.push({ field: 'city', message: 'City must be at least 2 characters' });
  } else if (!/^[a-zA-Z\s\-'\.]+$/.test(addressData.city)) {
    errors.push({ field: 'city', message: 'City contains invalid characters' });
  }

  // State validation
  if (!addressData.state.trim()) {
    errors.push({ field: 'state', message: 'State is required' });
  } else if (addressData.state.length < 2) {
    errors.push({ field: 'state', message: 'State must be at least 2 characters' });
  }

  // ZIP code validation (US format)
  if (!addressData.zip_code.trim()) {
    errors.push({ field: 'zip_code', message: 'ZIP code is required' });
  } else if (addressData.country === 'United States') {
    const zipPattern = /^(\d{5})(-\d{4})?$/;
    if (!zipPattern.test(addressData.zip_code)) {
      errors.push({ field: 'zip_code', message: 'Invalid ZIP code format (use 12345 or 12345-6789)' });
    }
  } else if (addressData.zip_code.length < 3) {
    errors.push({ field: 'zip_code', message: 'ZIP/Postal code must be at least 3 characters' });
  }

  // Country validation
  if (!addressData.country.trim()) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  return errors;
};

export const formatValidationErrors = (errors: AddressValidationError[]): string => {
  return errors.map(error => error.message).join(', ');
};
