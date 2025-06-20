
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmailTemplateEditor } from "./EmailTemplateEditor";

interface EmailFormFieldsProps {
  subject: string;
  onSubjectChange: (value: string) => void;
  message: string;
  onMessageChange: (value: string) => void;
  quoteNumber?: string;
  quoteId: string;
  contactName?: string;
  quoteOwnerName: string;
}

export const EmailFormFields = ({
  subject,
  onSubjectChange,
  message,
  onMessageChange,
  quoteNumber,
  quoteId,
  contactName,
  quoteOwnerName
}: EmailFormFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">Message</Label>
          <EmailTemplateEditor
            currentTemplate={message}
            onTemplateChange={onMessageChange}
            contactName={contactName}
            quoteOwnerName={quoteOwnerName}
          />
        </div>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Email message"
          rows={8}
          className="resize-none"
        />
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Attachment:</strong> Quote_{quoteNumber || quoteId.slice(0, 8)}.pdf
        </p>
      </div>
    </>
  );
};
