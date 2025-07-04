
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientSelector } from "./ClientSelector";
import { DealSelector } from "./DealSelector";
import { CircuitRequirements } from "./CircuitRequirements";
import { AddressInput } from "./AddressInput";
import { useAddCircuitQuoteForm } from "./useAddCircuitQuoteForm";
import { DealDetailsDialog } from "@/components/CircuitQuotes/DealDetailsDialog";

interface AddCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuoteAdded?: () => void;
}

export const AddCircuitQuoteDialog = ({ 
  open, 
  onOpenChange, 
  onQuoteAdded 
}: AddCircuitQuoteDialogProps) => {
  const {
    // Form state
    clientId,
    setClientId,
    selectedDealId,
    setSelectedDealId,
    location,
    setLocation,
    suite,
    setSuite,
    staticIp,
    setStaticIp,
    slash29,
    setSlash29,
    dhcp,
    setDhcp,
    mikrotikRequired,
    setMikrotikRequired,
    
    // Data
    clientInfos,
    deals,
    
    // Loading states
    isSubmitting,
    
    // Actions
    handleSubmit
  } = useAddCircuitQuoteForm({ onQuoteAdded, onOpenChange });

  const [showDealDetails, setShowDealDetails] = useState(false);

  const selectedDeal = deals.find(deal => deal.id === selectedDealId);

  const handleViewDealDetails = () => {
    setShowDealDetails(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Circuit Quote</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ClientSelector
              clientInfos={clientInfos}
              clientId={clientId}
              onClientChange={setClientId}
            />

            <DealSelector
              deals={deals}
              selectedDealId={selectedDealId}
              onDealChange={setSelectedDealId}
              onViewDealDetails={handleViewDealDetails}
            />

            <AddressInput
              location={location}
              suite={suite}
              onLocationChange={setLocation}
              onSuiteChange={setSuite}
            />

            <CircuitRequirements
              staticIp={staticIp}
              slash29={slash29}
              dhcp={dhcp}
              mikrotikRequired={mikrotikRequired}
              onStaticIpChange={setStaticIp}
              onSlash29Change={setSlash29}
              onDhcpChange={setDhcp}
              onMikrotikChange={setMikrotikRequired}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !clientId || !selectedDealId || !location.trim()}
              >
                {isSubmitting ? "Creating..." : "Create Circuit Quote"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {selectedDeal && (
        <DealDetailsDialog
          open={showDealDetails}
          onOpenChange={setShowDealDetails}
          dealId={selectedDeal.id}
        />
      )}
    </>
  );
};
