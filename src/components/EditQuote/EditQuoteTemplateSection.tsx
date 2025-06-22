
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

interface EditQuoteTemplateSectionProps {
  selectedTemplateId: string;
  onTemplateChange: (value: string) => void;
  templates: QuoteTemplate[];
}

export const EditQuoteTemplateSection = ({
  selectedTemplateId,
  onTemplateChange,
  templates
}: EditQuoteTemplateSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="templateId">Quote Template (Required)</Label>
      <Select value={selectedTemplateId} onValueChange={onTemplateChange} required>
        <SelectTrigger>
          <SelectValue placeholder={
            templates.length === 0 
              ? "No templates available" 
              : selectedTemplateId 
                ? `${templates.find(t => t.id === selectedTemplateId)?.name}${templates.find(t => t.id === selectedTemplateId)?.is_default ? " (Default)" : ""}`
                : "Select template"
          } />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name} {template.is_default && "(Default)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {templates.length === 0 && (
        <p className="text-sm text-red-500">
          No templates available. Create templates in System Settings → Quote Templates.
        </p>
      )}
    </div>
  );
};
