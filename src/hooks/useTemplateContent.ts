
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTemplateContent = (templateId: string | undefined) => {
  const [templateContent, setTemplateContent] = useState<string>('');
  const [templateLoading, setTemplateLoading] = useState(false);

  const fetchTemplateContent = async () => {
    if (!templateId) return;

    try {
      setTemplateLoading(true);
      const { data: template, error: templateError } = await supabase
        .from('quote_templates')
        .select('content')
        .eq('id', templateId)
        .single();

      if (!templateError && template) {
        setTemplateContent(template.content);
      }
    } catch (err) {
      console.error('Error fetching template content:', err);
    } finally {
      setTemplateLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplateContent();
  }, [templateId]);

  return {
    templateContent,
    templateLoading
  };
};
