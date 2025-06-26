import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { VendorFolder, VendorAttachment } from "@/types/vendorAttachments";

export const useVendorAttachments = (vendorId?: string) => {
  const [folders, setFolders] = useState<VendorFolder[]>([]);
  const [attachments, setAttachments] = useState<VendorAttachment[]>([]);
  const [allAttachments, setAllAttachments] = useState<VendorAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFolders = async () => {
    if (!vendorId) return;
    
    try {
      const { data, error } = await supabase
        .from('vendor_folders')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch folders",
        variant: "destructive"
      });
    }
  };

  const fetchAttachments = async () => {
    if (!vendorId) return;
    
    try {
      const { data, error } = await supabase
        .from('vendor_attachments')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('file_name');

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attachments",
        variant: "destructive"
      });
    }
  };

  const fetchAllAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_attachments')
        .select('*')
        .order('file_name');

      if (error) throw error;
      setAllAttachments(data || []);
    } catch (error) {
      console.error('Error fetching all attachments:', error);
    }
  };

  const createFolder = async (name: string, parentFolderId?: string) => {
    if (!user || !vendorId) return;

    try {
      const { data, error } = await supabase
        .from('vendor_folders')
        .insert({
          vendor_id: vendorId,
          name,
          parent_folder_id: parentFolderId
        })
        .select()
        .single();

      if (error) throw error;
      setFolders(prev => [...prev, data]);
      toast({
        title: "Folder created",
        description: `${name} folder has been created successfully.`,
      });
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (file: File, folderId?: string, isPublic: boolean = false): Promise<VendorAttachment | null> => {
    if (!user || !vendorId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${vendorId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vendor-attachments')
        .getPublicUrl(filePath);

      // Save attachment record to database
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('vendor_attachments')
        .insert({
          vendor_id: vendorId,
          folder_id: folderId,
          file_name: file.name,
          file_path: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          is_public: isPublic
        })
        .select()
        .single();

      if (attachmentError) throw attachmentError;

      setAttachments(prev => [...prev, attachmentData]);
      setAllAttachments(prev => [...prev, attachmentData]);
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
      return attachmentData;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive"
      });
      return null;
    }
  };

  const moveAttachment = async (attachmentId: string, newFolderId?: string) => {
    try {
      const { error } = await supabase
        .from('vendor_attachments')
        .update({ folder_id: newFolderId })
        .eq('id', attachmentId);

      if (error) throw error;

      setAttachments(prev => 
        prev.map(att => 
          att.id === attachmentId 
            ? { ...att, folder_id: newFolderId }
            : att
        )
      );
      toast({
        title: "File moved",
        description: "File has been moved successfully.",
      });
    } catch (error) {
      console.error('Error moving attachment:', error);
      toast({
        title: "Error",
        description: "Failed to move file",
        variant: "destructive"
      });
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      setAllAttachments(prev => prev.filter(att => att.id !== attachmentId));
      toast({
        title: "File deleted",
        description: "File has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const togglePublicStatus = async (attachmentId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('vendor_attachments')
        .update({ is_public: isPublic })
        .eq('id', attachmentId);

      if (error) throw error;

      setAttachments(prev => 
        prev.map(att => 
          att.id === attachmentId 
            ? { ...att, is_public: isPublic }
            : att
        )
      );
      setAllAttachments(prev => 
        prev.map(att => 
          att.id === attachmentId 
            ? { ...att, is_public: isPublic }
            : att
        )
      );
      toast({
        title: isPublic ? "File made public" : "File made private",
        description: isPublic ? "Agents can now see this file" : "Only admins can see this file",
      });
    } catch (error) {
      console.error('Error updating attachment visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update file visibility",
        variant: "destructive"
      });
    }
  };

  const getTotalAttachmentCount = useMemo(() => {
    return (targetVendorId?: string): number => {
      if (!targetVendorId) return 0;
      return allAttachments.filter(a => a.vendor_id === targetVendorId).length;
    };
  }, [allAttachments]);

  useEffect(() => {
    fetchAllAttachments();
  }, []);

  useEffect(() => {
    if (vendorId) {
      Promise.all([fetchFolders(), fetchAttachments()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [vendorId]);

  return {
    folders,
    attachments,
    isLoading,
    createFolder,
    uploadFile,
    moveAttachment,
    deleteAttachment,
    togglePublicStatus,
    getTotalAttachmentCount,
    refetch: () => {
      fetchFolders();
      fetchAttachments();
      fetchAllAttachments();
    }
  };
};
