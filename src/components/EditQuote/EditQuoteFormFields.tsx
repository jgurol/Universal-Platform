
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClientInfo } from "@/types/index";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="description">Quote Name</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter quote name..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientInfo">Client Company</Label>
        <Select value={clientInfoId} onValueChange={onClientInfoIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a client company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No client company</SelectItem>
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
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
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

      <div className="col-span-1 md:col-span-2 space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Additional notes about the quote"
          rows={3}
        />
      </div>
    </div>
  );
};
