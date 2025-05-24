
import { supabase } from '@/integrations/supabase/client';

export const makeUserAdmin = async (userId: string) => {
  try {
    const { error } = await supabase.rpc('make_user_admin', {
      user_id: userId
    });
    
    if (error) {
      console.error('Error making user admin:', error);
      throw error;
    }
    
    console.log('Successfully made user admin');
    return true;
  } catch (error) {
    console.error('Failed to make user admin:', error);
    throw error;
  }
};

// Function to make Jim Gurol an admin specifically
export const makeJimGurolAdmin = async () => {
  const jimGurolUserId = '09b10a20-fda0-41e8-bc34-49a891023379';
  return await makeUserAdmin(jimGurolUserId);
};
