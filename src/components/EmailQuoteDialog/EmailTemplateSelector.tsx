
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Info } from "lucide-react";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EmailTemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (template: EmailTemplate | null) => void;
}

export const EmailTemplateSelector = ({ selectedTemplateId, onTemplateSelect }: EmailTemplateSelectorProps) => {
  const { templates, isLoading, refetch } = useEmailTemplates();
  const [showPreview, setShowPreview] = React.useState(false);
  
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

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
      
      {selectedTemplate && (
        <div className="mt-2">
          <Collapsible open={showPreview} onOpenChange={setShowPreview}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <Info className="h-3 w-3 mr-1" />
                {showPreview ? 'Hide' : 'Show'} Template Preview
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="p-3 bg-gray-50 rounded border text-sm">
                <div className="space-y-2">
                  <div>
                    <strong>Subject:</strong> {selectedTemplate.subject}
                  </div>
                  <div>
                    <strong>Content Preview:</strong>
                    <div className="mt-1 text-gray-600 text-xs whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {selectedTemplate.content.substring(0, 200)}
                      {selectedTemplate.content.length > 200 && '...'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">Variables will be replaced</Badge>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
      
      {templates.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground">
          No email templates found. Create templates in Templates → Email Templates.
        </p>
      )}
    </div>
  );
};
