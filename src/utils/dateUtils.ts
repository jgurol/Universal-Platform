
import { supabase } from "@/integrations/supabase/client";

// Get timezone from user profile in database, with fallback to default
export const getAppTimezone = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 'America/Los_Angeles'; // Default fallback
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.log('No profile found or error fetching timezone, using default');
      return 'America/Los_Angeles';
    }

    return profile.timezone || 'America/Los_Angeles';
  } catch (error) {
    console.error('Error fetching timezone from profile:', error);
    return 'America/Los_Angeles';
  }
};

// Synchronous version that uses a cached value for immediate use
let cachedTimezone: string | null = null;

export const getAppTimezoneSync = (): string => {
  return cachedTimezone || 'America/Los_Angeles';
};

// Initialize and cache the timezone
export const initializeTimezone = async (): Promise<void> => {
  cachedTimezone = await getAppTimezone();
};

// Update user's timezone preference
export const updateUserTimezone = async (timezone: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ timezone })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating timezone:', error);
      return false;
    }

    // Update cached value
    cachedTimezone = timezone;
    return true;
  } catch (error) {
    console.error('Error updating user timezone:', error);
    return false;
  }
};

// Format date for input field (YYYY-MM-DD) using the app's configured timezone
export const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return "";
  
  console.log("[formatDateForInput] Input dateString:", dateString);
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.log("[formatDateForInput] Already in YYYY-MM-DD format, returning:", dateString);
    return dateString;
  }
  
  try {
    const timezone = getAppTimezoneSync();
    console.log("[formatDateForInput] Using timezone:", timezone);
    
    // Parse the date and format it in the configured timezone
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log("[formatDateForInput] Invalid date, returning empty string");
      return "";
    }
    
    // Format the date in the configured timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const result = formatter.format(date);
    console.log("[formatDateForInput] Formatted result:", result);
    return result;
  } catch (error) {
    console.error("[formatDateForInput] Error formatting date:", error);
    return "";
  }
};

// Format date for display using the app's configured timezone
export const formatDateForDisplay = (dateString: string | undefined): string => {
  if (!dateString) return "";
  
  console.log("[formatDateForDisplay] Input dateString:", dateString);
  
  try {
    const timezone = getAppTimezoneSync();
    console.log("[formatDateForDisplay] Using timezone:", timezone);
    
    let date: Date;
    
    // If it's in YYYY-MM-DD format, parse it correctly to avoid timezone shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Parse as local date to avoid timezone conversion issues
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.log("[formatDateForDisplay] Invalid date, returning original string");
      return dateString;
    }
    
    // Format the date in the configured timezone for display
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    
    const result = formatter.format(date);
    console.log("[formatDateForDisplay] Formatted result:", result);
    return result;
  } catch (error) {
    console.error("[formatDateForDisplay] Error formatting date:", error);
    return dateString;
  }
};

// Create a date string from input (keeps it in YYYY-MM-DD format)
export const createDateString = (inputValue: string): string => {
  console.log("[createDateString] Input value:", inputValue);
  if (!inputValue) return "";
  
  // Return the input value as-is since it's already in YYYY-MM-DD format
  console.log("[createDateString] Returning:", inputValue);
  return inputValue;
};

// Get today's date in the configured timezone as YYYY-MM-DD
export const getTodayInTimezone = (): string => {
  const timezone = getAppTimezoneSync();
  const today = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(today);
};
