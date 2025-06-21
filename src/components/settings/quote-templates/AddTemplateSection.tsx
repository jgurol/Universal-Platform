
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/context/SystemSettingsContext";

export const AddTemplateSection: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading, setLoading, fetchTemplates } = useSystemSettings();
  const [newTemplate, setNewTemplate] = useState({ name: "", content: "" });

  // Basic validation for template content - less restrictive
  const validateTemplateContent = (content: string, name: string): { isValid: boolean; error?: string } => {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: "Please provide content for the template" };
    }
    
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: "Please provide a name for the template" };
    }
    
    if (content.length > 50000) {
      return { isValid: false, error: "Template content is too long (max 50,000 characters)" };
    }
    
    if (name.length > 200) {
      return { isValid: false, error: "Template name is too long (max 200 characters)" };
    }
    
    // Only check for obvious script tags and dangerous patterns
    const dangerousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];
    
    const hasDangerousContent = dangerousPatterns.some(pattern => 
      pattern.test(content) || pattern.test(name)
    );
    
    if (hasDangerousContent) {
      return { isValid: false, error: "Content contains potentially dangerous script elements" };
    }
    
    return { isValid: true };
  };

  const handleAddTemplate = async () => {
    const validation = validateTemplateContent(newTemplate.content, newTemplate.name);
    if (!validation.isValid) {
      toast({
        title: "Validation error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_templates')
        .insert([{
          name: newTemplate.name.trim(),
          content: newTemplate.content.trim(),
          user_id: user?.id!
        }]);

      if (error) throw error;

      setNewTemplate({ name: "", content: "" });
      fetchTemplates();
      toast({
        title: "Template added",
        description: "Quote template has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error adding template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add New Template
      </h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            id="templateName"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            placeholder="Enter template name (e.g., Standard Terms)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="templateContent">Terms & Conditions Content</Label>
          <RichTextEditor
            value={newTemplate.content}
            onChange={(content) => setNewTemplate({ ...newTemplate, content })}
            placeholder="Enter the terms and conditions text..."
            rows={6}
          />
        </div>
        <Button onClick={handleAddTemplate} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>
    </div>
  );
};
