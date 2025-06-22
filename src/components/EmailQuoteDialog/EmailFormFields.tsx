
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays1, setReminderDays1] = useState("7");
  const [reminderDays2, setReminderDays2] = useState("14");
  const [reminderDays3, setReminderDays3] = useState("3");
  const [reminderType1, setReminderType1] = useState("days-from-sent");
  const [reminderType2, setReminderType2] = useState("days-from-sent");
  const [reminderType3, setReminderType3] = useState("days-before-expiry");

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

      {/* Send Automated Reminder Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="reminder" 
            checked={reminderEnabled}
            onCheckedChange={(checked) => setReminderEnabled(!!checked)}
          />
          <Label htmlFor="reminder" className="text-sm font-medium">
            Send Automated Reminder
          </Label>
          <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-500">
            ?
          </div>
        </div>

        {reminderEnabled && (
          <div className="ml-6 space-y-3">
            {/* First Reminder */}
            <div className="flex items-center space-x-2">
              <Checkbox id="reminder1" defaultChecked />
              <Input
                value={reminderDays1}
                onChange={(e) => setReminderDays1(e.target.value)}
                className="w-16"
              />
              <Select value={reminderType1} onValueChange={setReminderType1}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days-from-sent">Days from sent</SelectItem>
                  <SelectItem value="days-before-expiry">Days before expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Second Reminder */}
            <div className="flex items-center space-x-2">
              <Checkbox id="reminder2" defaultChecked />
              <Input
                value={reminderDays2}
                onChange={(e) => setReminderDays2(e.target.value)}
                className="w-16"
              />
              <Select value={reminderType2} onValueChange={setReminderType2}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days-from-sent">Days from sent</SelectItem>
                  <SelectItem value="days-before-expiry">Days before expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Third Reminder */}
            <div className="flex items-center space-x-2">
              <Checkbox id="reminder3" defaultChecked />
              <Input
                value={reminderDays3}
                onChange={(e) => setReminderDays3(e.target.value)}
                className="w-16"
              />
              <Select value={reminderType3} onValueChange={setReminderType3}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days-from-sent">Days from sent</SelectItem>
                  <SelectItem value="days-before-expiry">Days before expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
