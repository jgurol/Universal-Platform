
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CircuitQuoteStatusSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const CircuitQuoteStatusSelect = ({ value, onValueChange }: CircuitQuoteStatusSelectProps) => {
  const statusOptions = [
    { value: 'new_pricing', label: 'New Pricing' },
    { value: 'researching', label: 'Researching' },
    { value: 'completed', label: 'Completed' },
    { value: 'sent_to_customer', label: 'Sent to Customer' }
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
