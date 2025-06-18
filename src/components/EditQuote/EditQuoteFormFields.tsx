
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClientInfo } from "@/pages/Index";
import { ImprovedRichTextEditor } from "@/components/ImprovedRichTextEditor";

interface EditQuoteFormFieldsProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  clientInfoId: string;
  onClientInfoIdChange: (value: string) => void;
  clientInfos: ClientInfo[];
  status: string;
  onStatusChange: (value: string) => void;
  commissionOverride: string;
  onCommissionOverrideChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

export const EditQuoteFormFields = ({
  description,
  onDescriptionChange,
  clientInfoId,
  onClientInfoIdChange,
  clientInfos,
  status,
  onStatusChange,
  commissionOverride,
  onCommissionOverrideChange,
  notes,
  onNotesChange
}: EditQuoteFormFieldsProps) => {
  console.log('[EditQuoteFormFields] Rendering with description:', description);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Quote Name</Label>
        <ImprovedRichTextEditor
          value={description}
          onChange={(value) => {
            console.log('[EditQuoteFormFields] Description changed to:', value);
            onDescriptionChange(value);
          }}
          placeholder="Enter quote name"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientInfo">Client Company</Label>
        <Select value={clientInfoId} onValueChange={onClientInfoIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a client company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No client selected</SelectItem>
            {clientInfos.map((clientInfo) => (
              <SelectItem key={clientInfo.id} value={clientInfo.id}>
                {clientInfo.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commissionOverride">Commission Override (%)</Label>
        <Input
          id="commissionOverride"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={commissionOverride}
          onChange={(e) => onCommissionOverrideChange(e.target.value)}
          placeholder="Optional commission override"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Additional notes about the quote"
          rows={3}
        />
      </div>
    </>
  );
};
