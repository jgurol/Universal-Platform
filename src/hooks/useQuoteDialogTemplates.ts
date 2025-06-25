
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

export const useQuoteDialogTemplates = (open: boolean) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);

  // Load templates when dialog opens and auto-select default
  useEffect(() => {
    const fetchTemplates = async () => {
      if (open && user) {
        console.log('[useQuoteDialogTemplates] Fetching templates for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('quote_templates')
            .select('*')
            .order('name');

          console.log('[useQuoteDialogTemplates] Templates query result:', { data, error });
          
          if (error) {
            console.error('[useQuoteDialogTemplates] Error fetching templates:', error);
            setTemplates([]);
            toast({
              title: "Warning",
              description: "Could not load quote templates. You may need to create one first.",
              variant: "destructive",
            });
            return;
          }
          
          setTemplates(data || []);
          console.log('[useQuoteDialogTemplates] Templates set:', data?.length || 0, 'templates');
        } catch (error) {
          console.error('[useQuoteDialogTemplates] Error loading templates:', error);
          setTemplates([]);
          toast({
            title: "Warning",
            description: "Could not load quote templates. You may need to create one first.",
            variant: "destructive",
          });
        }
      }
    };

    fetchTemplates();
  }, [open, user, toast]);

  return {
    templates,
    setTemplates
  };
};
