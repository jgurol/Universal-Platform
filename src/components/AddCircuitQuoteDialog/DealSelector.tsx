
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { DealRegistration } from "@/services/dealRegistrationService";

interface DealSelectorProps {
  deals: DealRegistration[];
  selectedDealId: string;
  onDealChange: (dealId: string) => void;
  onViewDealDetails: () => void;
}

export const DealSelector = ({ deals, selectedDealId, onDealChange, onViewDealDetails }: DealSelectorProps) => {
  const isDealSelected = selectedDealId && selectedDealId !== "" && selectedDealId !== "no-deal";

  return (
    <div className="space-y-2">
      <Label htmlFor="dealRegistration">Deal Registration *</Label>
      <div className="flex gap-2">
        <Select value={selectedDealId} onValueChange={onDealChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a deal registration" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {deals.map((deal) => (
              <SelectItem key={deal.id} value={deal.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{deal.deal_name}</span>
                  <span className="text-sm text-gray-500">
                    ${deal.deal_value.toLocaleString()} - {deal.stage}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {isDealSelected && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onViewDealDetails}
            title="View deal details"
            className="shrink-0"
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
