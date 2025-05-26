
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, FileText } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

export const TemplatesList: React.FC = () => {
  const { toast } = useToast();
  const { templates, loading, setLoading, fetchTemplates } = useSystemSettings();
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_templates')
        .update({
          name: editingTemplate.name,
          content: editingTemplate.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      setEditingTemplate(null);
      fetchTemplates();
      toast({
        title: "Template updated",
        description: "Quote template has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      fetchTemplates();
      toast({
        title: "Template deleted",
        description: "Quote template has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      await supabase
        .from('quote_templates')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { error } = await supabase
        .from('quote_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      fetchTemplates();
      toast({
        title: "Default template set",
        description: "This template is now the default for new quotes",
      });
    } catch (error: any) {
      toast({
        title: "Error setting default",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Existing Templates</h3>
      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No templates found. Create your first template above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 space-y-3">
              {editingTemplate?.id === template.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="Template name"
                  />
                  <RichTextEditor
                    value={editingTemplate.content}
                    onChange={(content) => setEditingTemplate({ ...editingTemplate, content })}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateTemplate} disabled={loading}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                      )}
                    </h4>
                    <div className="flex gap-2">
                      {!template.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultTemplate(template.id)}
                          disabled={loading}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <div dangerouslySetInnerHTML={{ __html: template.content }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
