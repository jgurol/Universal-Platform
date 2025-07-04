
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Label htmlFor="description" className="text-sm font-semibold text-gray-800">Description *</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter quote description"
          required
          className="border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="clientInfo" className="text-sm font-semibold text-gray-800">Client Company *</Label>
        <Select value={clientInfoId} onValueChange={onClientInfoIdChange}>
          <SelectTrigger className="border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors">
            <SelectValue placeholder="Select client company" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 shadow-lg">
            {clientInfos.map((client) => (
              <SelectItem key={client.id} value={client.id} className="hover:bg-gray-100">
                {client.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label htmlFor="status" className="text-sm font-semibold text-gray-800">Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 shadow-lg">
            <SelectItem value="pending" className="hover:bg-gray-100">Pending</SelectItem>
            <SelectItem value="approved" className="hover:bg-gray-100">Approved</SelectItem>
            <SelectItem value="rejected" className="hover:bg-gray-100">Rejected</SelectItem>
            <SelectItem value="sent" className="hover:bg-gray-100">Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label htmlFor="commissionOverride" className="text-sm font-semibold text-gray-800">Commission Override (%)</Label>
        <Input
          id="commissionOverride"
          type="number"
          value={commissionOverride}
          onChange={(e) => onCommissionOverrideChange(e.target.value)}
          placeholder="Enter commission override"
          step="0.01"
          className="border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Notes section moved to full width */}
      <div className="md:col-span-2 space-y-3">
        <Label htmlFor="notes" className="text-sm font-semibold text-gray-800">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Enter any additional notes"
          rows={4}
          className="border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
};
