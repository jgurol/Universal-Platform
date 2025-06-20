
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, RotateCcw } from "lucide-react";

interface EmailTemplateEditorProps {
  currentTemplate: string;
  onTemplateChange: (template: string) => void;
  contactName?: string;
  quoteOwnerName: string;
}

export const EmailTemplateEditor = ({
  currentTemplate,
  onTemplateChange,
  contactName,
  quoteOwnerName
}: EmailTemplateEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editableTemplate, setEditableTemplate] = useState(currentTemplate);

  const defaultTemplate = `${contactName ? `Hi ${contactName},` : 'Hi,'}

Please find attached your quote for the requested services. If would like to proceed with this proposal click the green accept button on the PDF agreement. If you have any questions please don't hesitate to contact us.

Thank you for your business.

Best regards,
${quoteOwnerName}`;

  const handleSave = () => {
    onTemplateChange(editableTemplate);
    setIsOpen(false);
  };

  const handleReset = () => {
    setEditableTemplate(defaultTemplate);
  };

  const handleCancel = () => {
    setEditableTemplate(currentTemplate);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Edit className="w-4 h-4 mr-1" />
          Edit Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Email Template</DialogTitle>
          <DialogDescription>
            Customize the email message that will be sent with the quote. Use the variables below for personalization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Available Variables:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Contact Name:</strong> {contactName || 'Not available'}</div>
              <div><strong>Quote Owner:</strong> {quoteOwnerName}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Email Message</Label>
            <Textarea
              id="template"
              value={editableTemplate}
              onChange={(e) => setEditableTemplate(e.target.value)}
              rows={12}
              className="resize-none"
              placeholder="Enter your email template..."
            />
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Template
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
