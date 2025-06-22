
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useQuoteOwnerName = (quoteUserId?: string) => {
  const [quoteOwnerName, setQuoteOwnerName] = useState('');
  const [ownerNameLoaded, setOwnerNameLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuoteOwnerName = async () => {
      console.log('useQuoteOwnerName - Fetching quote owner name for user_id:', quoteUserId);
      
      // If quote doesn't have user_id, use current user as fallback
      const ownerUserId = quoteUserId || user?.id;
      
      if (!ownerUserId) {
        console.log('useQuoteOwnerName - No user_id found and no current user, using fallback');
        setQuoteOwnerName('Sales Team');
        setOwnerNameLoaded(true);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', ownerUserId)
          .single();
        
        console.log('useQuoteOwnerName - Profile query result:', { profile, error });
        
        if (!error && profile?.full_name && profile.full_name.trim() !== '') {
          console.log('useQuoteOwnerName - Found quote owner name:', profile.full_name);
          setQuoteOwnerName(profile.full_name);
        } else if (!error && profile?.email) {
          console.log('useQuoteOwnerName - Using email as fallback name:', profile.email);
          setQuoteOwnerName(profile.email.split('@')[0]); // Use part before @ as name
        } else {
          console.log('useQuoteOwnerName - Could not fetch quote owner name, using current user fallback');
          // If we can't get the quote owner, use current user info
          if (user?.email) {
            setQuoteOwnerName(user.email.split('@')[0]);
          } else {
            setQuoteOwnerName('Sales Team');
          }
        }
      } catch (error) {
        console.error('useQuoteOwnerName - Error fetching quote owner name:', error);
        // Use current user as fallback
        if (user?.email) {
          setQuoteOwnerName(user.email.split('@')[0]);
        } else {
          setQuoteOwnerName('Sales Team');
        }
      }
      setOwnerNameLoaded(true);
    };

    fetchQuoteOwnerName();
  }, [quoteUserId, user]);

  return { quoteOwnerName, ownerNameLoaded };
};
