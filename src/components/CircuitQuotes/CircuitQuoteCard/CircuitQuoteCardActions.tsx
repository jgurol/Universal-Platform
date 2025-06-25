
import { useState } from "react";
import { AddCarrierQuoteDialog } from "@/components/AddCarrierQuoteDialog";
import { EditCarrierQuoteDialog } from "@/components/EditCarrierQuoteDialog";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { useToast } from "@/hooks/use-toast";

interface CircuitQuoteCardActionsProps {
  onAddCarrier?: (carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => void;
  onUpdateCarrier?: (carrier: CarrierQuote) => void;
}

export const CircuitQuoteCardActions = ({
  onAddCarrier,
  onUpdateCarrier
}: CircuitQuoteCardActionsProps) => {
  const [isAddCarrierDialogOpen, setIsAddCarrierDialogOpen] = useState(false);
  const [isEditCarrierDialogOpen, setIsEditCarrierDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<CarrierQuote | null>(null);
  const { toast } = useToast();

  const addCarrierQuote = (carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    if (onAddCarrier) {
      onAddCarrier(carrierQuote);
    }
  };

  const copyCarrierQuote = (carrier: CarrierQuote) => {
    const carrierCopy = {
      carrier: carrier.carrier,
      type: carrier.type,
      speed: carrier.speed,
      price: 0, // Reset price for copied quote
      term: carrier.term,
      notes: `Copied from ${carrier.carrier} quote`,
      color: carrier.color,
      install_fee: carrier.install_fee || false,
      install_fee_amount: carrier.install_fee_amount || 0,
      site_survey_needed: carrier.site_survey_needed || false,
      no_service: carrier.no_service || false,
      static_ip: carrier.static_ip || false,
      static_ip_fee_amount: carrier.static_ip_fee_amount || 0,
      static_ip_5: carrier.static_ip_5 || false,
      static_ip_5_fee_amount: carrier.static_ip_5_fee_amount || 0
    };

    if (onAddCarrier) {
      onAddCarrier(carrierCopy);
      toast({
        title: "Carrier Quote Copied",
        description: `${carrier.carrier} quote has been copied successfully`,
      });
    }
  };

  const editCarrierQuote = (updatedCarrier: CarrierQuote) => {
    if (onUpdateCarrier) {
      onUpdateCarrier(updatedCarrier);
    }
  };

  const handleEditCarrier = (carrier: CarrierQuote) => {
    setEditingCarrier(carrier);
    setIsEditCarrierDialogOpen(true);
  };

  return {
    isAddCarrierDialogOpen,
    setIsAddCarrierDialogOpen,
    isEditCarrierDialogOpen,
    setIsEditCarrierDialogOpen,
    editingCarrier,
    addCarrierQuote,
    editCarrierQuote,
    copyCarrierQuote,
    handleEditCarrier,
    dialogs: (
      <>
        <AddCarrierQuoteDialog
          open={isAddCarrierDialogOpen}
          onOpenChange={setIsAddCarrierDialogOpen}
          onAddCarrier={addCarrierQuote}
        />

        {editingCarrier && (
          <EditCarrierQuoteDialog
            open={isEditCarrierDialogOpen}
            onOpenChange={setIsEditCarrierDialogOpen}
            carrier={editingCarrier}
            onUpdateCarrier={editCarrierQuote}
          />
        )}
      </>
    )
  };
};
