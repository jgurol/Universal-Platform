
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
    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Quote Template</h3>
      
      <div className="space-y-2">
        <Label htmlFor="templateId">Quote Template (Optional)</Label>
        <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template to include" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No template</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} {template.is_default && "(Default)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {templates.length === 0 && (
          <p className="text-sm text-gray-500">
            No templates available. Create templates in System Settings.
          </p>
        )}
      </div>
    </div>
  );
};
