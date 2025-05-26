
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

  const handleAddTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Validation error",
        description: "Please provide both name and content for the template",
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
