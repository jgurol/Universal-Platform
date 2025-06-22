
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { VendorPriceSheet } from "@/types/vendorPriceSheets";

export const useVendorPriceSheets = () => {
  const [priceSheets, setPriceSheets] = useState<VendorPriceSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchPriceSheets = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('vendor_price_sheets')
        .select('*');

      // For agents, show only public sheets OR their own sheets
      // For admins, show all sheets
      if (!isAdmin) {
        query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching price sheets:', error);
        toast({
          title: "Error",
          description: "Failed to fetch price sheets",
          variant: "destructive"
        });
      } else {
        setPriceSheets(data || []);
      }
    } catch (err) {
      console.error('Error in fetchPriceSheets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyFileExists = async (filePath: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage
        .from('vendor-price-sheets')
        .list('', { search: filePath });
      
      if (error) {
        console.error('Error checking file existence:', error);
        return false;
      }
      
      return data && data.some(file => filePath.includes(file.name));
    } catch (error) {
      console.error('Error verifying file exists:', error);
      return false;
    }
  };

  const cleanupOrphanedRecords = async () => {
    if (!isAdmin) return; // Only admins can cleanup
    
    try {
      for (const sheet of priceSheets) {
        const exists = await verifyFileExists(sheet.file_path);
        if (!exists) {
          console.log(`File not found for sheet ${sheet.name}, removing database record`);
          await supabase
            .from('vendor_price_sheets')
            .delete()
            .eq('id', sheet.id);
        }
      }
      
      // Refresh the list after cleanup
      await fetchPriceSheets();
      
      toast({
        title: "Cleanup completed",
        description: "Removed database records for missing files",
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: "Cleanup failed",
        description: "Failed to clean up orphaned records",
        variant: "destructive"
      });
    }
  };

  const uploadPriceSheet = async (file: File, name: string, vendorId?: string, isPublic?: boolean) => {
    if (!user) return;

    try {
      // Create file path with user ID folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading file to path:', filePath);

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('vendor-price-sheets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully, saving to database');

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from('vendor_price_sheets')
        .insert({
          user_id: user.id,
          vendor_id: vendorId || null,
          name,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          is_public: isPublic || false
        })
        .select('*')
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Database record created successfully');

      setPriceSheets(prev => [data, ...prev]);
      toast({
        title: "Price sheet uploaded",
        description: `${name} has been uploaded successfully.`,
      });

      return data;
    } catch (error) {
      console.error('Error uploading price sheet:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload price sheet",
        variant: "destructive"
      });
    }
  };

  const deletePriceSheet = async (priceSheetId: string) => {
    if (!user) return;

    try {
      const priceSheet = priceSheets.find(ps => ps.id === priceSheetId);
      if (!priceSheet) return;

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('vendor-price-sheets')
        .remove([priceSheet.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('vendor_price_sheets')
        .delete()
        .eq('id', priceSheetId);

      if (dbError) {
        throw dbError;
      }

      setPriceSheets(prev => prev.filter(ps => ps.id !== priceSheetId));
      toast({
        title: "Price sheet deleted",
        description: "Price sheet has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting price sheet:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete price sheet",
        variant: "destructive"
      });
    }
  };

  const downloadPriceSheet = async (priceSheet: VendorPriceSheet) => {
    try {
      const { data, error } = await supabase.storage
        .from('vendor-price-sheets')
        .download(priceSheet.file_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = priceSheet.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading price sheet:', error);
      toast({
        title: "Download failed",
        description: "Failed to download price sheet",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchPriceSheets();
    }
  }, [user, isAdmin]);

  return {
    priceSheets,
    isLoading,
    uploadPriceSheet,
    deletePriceSheet,
    downloadPriceSheet,
    fetchPriceSheets,
    cleanupOrphanedRecords,
    verifyFileExists
  };
};
