
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";

interface EmailTemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (template: EmailTemplate | null) => void;
}

export const EmailTemplateSelector = ({ selectedTemplateId, onTemplateSelect }: EmailTemplateSelectorProps) => {
  const { templates, isLoading, refetch } = useEmailTemplates();

  const handleTemplateChange = (templateId: string) => {
    if (templateId === "none") {
      onTemplateSelect(null);
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    onTemplateSelect(template || null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="emailTemplate">Email Template (Optional)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <Select value={selectedTemplateId} onValueChange={handleTemplateChange} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={
            isLoading 
              ? "Loading templates..." 
              : templates.length === 0 
                ? "No templates available" 
                : "Select a template (optional)"
          } />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No template (custom message)</SelectItem>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}{template.is_default ? " (Default)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {templates.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground">
          No email templates found. Create templates in System Settings → Templates.
        </p>
      )}
    </div>
  );
};
