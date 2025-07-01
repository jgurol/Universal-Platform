
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface App {
  id: string;
  name: string;
  description: string;
  route: string;
  icon_name: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

export interface UserAppAccess {
  id: string;
  user_id: string;
  app_id: string;
  app: App;
}

export const useAppAccess = () => {
  const { user } = useAuth();
  const [userApps, setUserApps] = useState<App[]>([]);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserApps = async () => {
    if (!user) return;

    try {
      // Get user's accessible apps
      const { data: userAppAccess, error: userError } = await supabase
        .from('user_app_access')
        .select(`
          id,
          user_id,
          app_id,
          apps (
            id,
            name,
            description,
            route,
            icon_name,
            color,
            is_active,
            display_order
          )
        `)
        .eq('user_id', user.id);

      if (userError) throw userError;

      const accessibleApps = userAppAccess
        ?.filter(access => access.apps?.is_active)
        .map(access => access.apps as App)
        .sort((a, b) => a.display_order - b.display_order) || [];

      setUserApps(accessibleApps);
    } catch (error) {
      console.error('Error fetching user apps:', error);
      setUserApps([]);
    }
  };

  const fetchAllApps = async () => {
    try {
      const { data: apps, error } = await supabase
        .from('apps')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setAllApps(apps || []);
    } catch (error) {
      console.error('Error fetching all apps:', error);
      setAllApps([]);
    }
  };

  const getUserAppAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_app_access')
        .select('app_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(access => access.app_id) || [];
    } catch (error) {
      console.error('Error fetching user app access:', error);
      return [];
    }
  };

  const updateUserAppAccess = async (userId: string, appIds: string[]) => {
    try {
      // First, remove all existing access for this user
      await supabase
        .from('user_app_access')
        .delete()
        .eq('user_id', userId);

      // Then, add the new access
      if (appIds.length > 0) {
        const accessRecords = appIds.map(appId => ({
          user_id: userId,
          app_id: appId,
          granted_by: user?.id
        }));

        const { error } = await supabase
          .from('user_app_access')
          .insert(accessRecords);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating user app access:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserApps();
      fetchAllApps();
    }
    setLoading(false);
  }, [user]);

  return {
    userApps,
    allApps,
    loading,
    fetchUserApps,
    fetchAllApps,
    getUserAppAccess,
    updateUserAppAccess
  };
};
