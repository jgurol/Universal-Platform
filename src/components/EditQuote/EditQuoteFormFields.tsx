
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInfo } from "@/pages/Index";

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
  term?: string;
  onTermChange?: (value: string) => void;
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
  onNotesChange,
  term,
  onTermChange
}: EditQuoteFormFieldsProps) => {
  console.log('[EditQuoteFormFields] Rendering with term:', term);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter quote description"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientInfo">Client Company *</Label>
        <Select value={clientInfoId} onValueChange={onClientInfoIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select client company" />
          </SelectTrigger>
          <SelectContent>
            {clientInfos.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.company_name}
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
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commissionOverride">Commission Override (%)</Label>
        <Input
          id="commissionOverride"
          type="number"
          value={commissionOverride}
          onChange={(e) => onCommissionOverrideChange(e.target.value)}
          placeholder="Enter commission override"
          step="0.01"
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="term">Initial Term</Label>
        <Select value={term || ""} onValueChange={onTermChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select initial term" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="">Select initial term</SelectItem>
            <SelectItem value="Month to Month">Month to Month</SelectItem>
            <SelectItem value="12 Months">12 Months</SelectItem>
            <SelectItem value="24 Months">24 Months</SelectItem>
            <SelectItem value="36 Months">36 Months</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Current term value: {term || 'none'}</p>
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Enter any additional notes"
          rows={3}
        />
      </div>
    </div>
  );
};
