
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface AgentAgreementTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useAgentAgreementTemplates = () => {
  const [templates, setTemplates] = useState<AgentAgreementTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTemplates = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('agent_agreement_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Failed to load templates",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Error in template fetch:', err);
      toast({
        title: "Error",
        description: "Failed to load template data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTemplate = async (templateData: {
    name: string;
    content: string;
    is_default: boolean;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agent_agreement_templates')
        .insert({
          ...templateData,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding template:', error);
        toast({
          title: "Failed to add template",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setTemplates(prev => [...prev, data]);
      toast({
        title: "Template added",
        description: `${data.name} has been added successfully.`,
      });
    } catch (err) {
      console.error('Error in add template operation:', err);
      toast({
        title: "Error",
        description: "Failed to add template",
        variant: "destructive"
      });
    }
  };

  const updateTemplate = async (id: string, templateData: {
    name: string;
    content: string;
    is_default: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('agent_agreement_templates')
        .update({
          ...templateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating template:', error);
        toast({
          title: "Failed to update template",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Template updated",
        description: `${data.name} has been updated successfully.`,
      });
    } catch (err) {
      console.error('Error in update template operation:', err);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive"
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_agreement_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Failed to delete template",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Template deleted",
        description: "Template has been deleted successfully.",
      });
    } catch (err) {
      console.error('Error in delete template operation:', err);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
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
    refetchTemplates: fetchTemplates
  };
};
