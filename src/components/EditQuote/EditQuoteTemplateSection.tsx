
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

interface EditQuoteTemplateSectionProps {
  selectedTemplateId: string;
  onTemplateChange: (value: string) => void;
  templates: QuoteTemplate[];
  term?: string;
  onTermChange?: (value: string) => void;
}

export const EditQuoteTemplateSection = ({
  selectedTemplateId,
  onTemplateChange,
  templates,
  term,
  onTermChange
}: EditQuoteTemplateSectionProps) => {
  const handleTermChange = (value: string) => {
    if (onTermChange) {
      onTermChange(value);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="space-y-2">
        <Label htmlFor="term" className="text-sm font-semibold text-gray-800">Initial Term</Label>
        <Select value={term || undefined} onValueChange={handleTermChange}>
          <SelectTrigger className="border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors">
            <SelectValue placeholder="Select initial term" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 shadow-lg">
            <SelectItem value="Month to Month" className="hover:bg-gray-100">Month to Month</SelectItem>
            <SelectItem value="12 Months" className="hover:bg-gray-100">12 Months</SelectItem>
            <SelectItem value="24 Months" className="hover:bg-gray-100">24 Months</SelectItem>
            <SelectItem value="36 Months" className="hover:bg-gray-100">36 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
