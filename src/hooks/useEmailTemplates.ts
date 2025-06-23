
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTemplates = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching email templates:', error);
        toast({
          title: "Error",
          description: "Failed to load email templates",
          variant: "destructive",
        });
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTemplate = async (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([{
          ...template,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding email template:', error);
        toast({
          title: "Error",
          description: "Failed to add email template",
          variant: "destructive",
        });
        return;
      }

      setTemplates(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Email template added successfully",
      });
    } catch (error) {
      console.error('Error adding email template:', error);
      toast({
        title: "Error",
        description: "Failed to add email template",
        variant: "destructive",
      });
    }
  };

  const updateTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating email template:', error);
        toast({
          title: "Error",
          description: "Failed to update email template",
          variant: "destructive",
        });
        return;
      }

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
    } catch (error) {
      console.error('Error updating email template:', error);
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting email template:', error);
        toast({
          title: "Error",
          description: "Failed to delete email template",
          variant: "destructive",
        });
        return;
      }

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Email template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting email template:', error);
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  return {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  };
};
