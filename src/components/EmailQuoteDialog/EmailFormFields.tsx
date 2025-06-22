
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmailFormFieldsProps {
  subject: string;
  onSubjectChange: (value: string) => void;
  message: string;
  onMessageChange: (value: string) => void;
  quoteNumber?: string;
  quoteId: string;
  contactName?: string;
  quoteOwnerName: string;
  fromEmail?: string;
  recipientEmails: string;
}

export const EmailFormFields = ({
  subject,
  onSubjectChange,
  message,
  onMessageChange,
  quoteNumber,
  quoteId,
  contactName,
  quoteOwnerName,
  fromEmail = "jim@californiatelecom.com",
  recipientEmails
}: EmailFormFieldsProps) => {
  return (
    <div className="space-y-6">
      {/* From Section - At the very top */}
      <div className="space-y-2">
        <Label htmlFor="from" className="text-sm font-medium">From</Label>
        <Input
          id="from"
          value={`${quoteOwnerName} <${fromEmail}>`}
          readOnly
          className="bg-gray-50 border-gray-200"
        />
      </div>

      {/* Recipients Section */}
      <div className="space-y-2">
        <Label htmlFor="recipients" className="text-sm font-medium">Recipients (comma separated)</Label>
        <div className="flex gap-2">
          <Input
            id="recipients"
            value={recipientEmails}
            readOnly
            className="flex-1 bg-cyan-50 border-cyan-200"
            placeholder="Enter recipient emails"
          />
          <button 
            type="button"
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
          >
            Add CC/BCC
          </button>
        </div>
      </div>

      {/* Subject Section */}
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      {/* Body Section */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">Body</Label>
        <div className="border rounded-md">
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
            <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm font-bold">B</button>
            <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm italic">I</button>
            <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">U</button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">↶</button>
            <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">↷</button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <Select defaultValue="font-family">
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Font Family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="font-family">Font Family</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="times">Times</SelectItem>
              </SelectContent>
            </Select>
            <button type="button" className="p-1 hover:bg-gray-200 rounded text-xs">A^</button>
            <button type="button" className="p-1 hover:bg-gray-200 rounded text-xs">A</button>
          </div>
          
          {/* Text Area */}
          <Textarea
            id="message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Email message"
            rows={8}
            className="border-0 resize-none focus-visible:ring-0 rounded-t-none"
          />
        </div>
      </div>
    </div>
  );
};
