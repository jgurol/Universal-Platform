
import { AddressSelector } from "@/components/AddressSelector";

interface EditQuoteAddressSectionProps {
  clientInfoId: string;
  selectedBillingAddressId: string | null;
  onBillingAddressChange: (addressId: string | null, customAddr?: string) => void;
  selectedServiceAddressId: string | null;
  onServiceAddressChange: (addressId: string | null, customAddr?: string) => void;
}

export const EditQuoteAddressSection = ({
  clientInfoId,
  selectedBillingAddressId,
  onBillingAddressChange,
  selectedServiceAddressId,
  onServiceAddressChange
}: EditQuoteAddressSectionProps) => {
  return (
    <>
      {/* Billing Address Selection */}
      <AddressSelector
        clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
        selectedAddressId={selectedBillingAddressId || undefined}
        onAddressChange={onBillingAddressChange}
        label="Billing Address"
        autoSelectPrimary={false}
      />

      {/* Service Address Selection */}
      <AddressSelector
        clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
        selectedAddressId={selectedServiceAddressId || undefined}
        onAddressChange={onServiceAddressChange}
        label="Service Address"
        autoSelectPrimary={false}
      />
    </>
  );
};
