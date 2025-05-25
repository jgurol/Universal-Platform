
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getTodayInTimezone = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date for display (e.g., "Jan 15, 2024")
export const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

// Format date for input fields (YYYY-MM-DD format)
export const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

// Create date string from input (handles timezone properly)
export const createDateString = (inputDate: string): string => {
  if (!inputDate) return '';
  
  try {
    // Create date in local timezone
    const date = new Date(inputDate + 'T00:00:00');
    return date.toISOString();
  } catch (error) {
    console.error('Error creating date string:', error);
    return '';
  }
};

// Timezone management functions
let userTimezone = 'America/Los_Angeles'; // Default timezone

export const initializeTimezone = async (): Promise<void> => {
  try {
    // Try to get user's timezone from browser
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    userTimezone = browserTimezone || 'America/Los_Angeles';
    console.log('Initialized timezone:', userTimezone);
  } catch (error) {
    console.error('Error initializing timezone:', error);
    userTimezone = 'America/Los_Angeles';
  }
};

export const updateUserTimezone = async (timezone: string): Promise<void> => {
  try {
    userTimezone = timezone;
    console.log('Updated user timezone to:', timezone);
  } catch (error) {
    console.error('Error updating user timezone:', error);
  }
};

export const getAppTimezone = (): string => {
  return userTimezone;
};
