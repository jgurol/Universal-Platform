
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentDetailsTabProps {
  paymentMethod?: string;
  onPaymentMethodChange?: (value: string) => void;
  paymentTerms?: string;
  onPaymentTermsChange?: (value: string) => void;
}

export const PaymentDetailsTab = ({
  paymentMethod = "",
  onPaymentMethodChange,
  paymentTerms = "",
  onPaymentTermsChange
}: PaymentDetailsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        <Select value={paymentTerms} onValueChange={onPaymentTermsChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="net_30">Net 30</SelectItem>
            <SelectItem value="net_60">Net 60</SelectItem>
            <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
            <SelectItem value="prepaid">Prepaid</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
