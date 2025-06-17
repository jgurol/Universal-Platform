
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CircuitQuoteStatusSelectProps {
  status: string;
  onStatusChange: (status: string) => void;
}

export const CircuitQuoteStatusSelect = ({ status, onStatusChange }: CircuitQuoteStatusSelectProps) => {
  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white z-50">
        <SelectItem value="new_pricing">New Pricing</SelectItem>
        <SelectItem value="researching">Researching</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
      </SelectContent>
    </Select>
  );
};
