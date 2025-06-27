
import { Switch } from "@/components/ui/switch";

interface ChargeTypeToggleProps {
  chargeType: 'MRC' | 'NRC';
  onChargeTypeChange: (isMRC: boolean) => void;
}

export const ChargeTypeToggle = ({ chargeType, onChargeTypeChange }: ChargeTypeToggleProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-1">
        <Switch
          checked={chargeType === 'MRC'}
          onCheckedChange={onChargeTypeChange}
        />
        <span className="text-xs font-medium">
          {chargeType}
        </span>
      </div>
    </div>
  );
};
