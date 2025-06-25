
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CircuitRequirementsProps {
  staticIp: boolean;
  slash29: boolean;
  dhcp: boolean;
  mikrotikRequired: boolean;
  onStaticIpChange: (checked: boolean) => void;
  onSlash29Change: (checked: boolean) => void;
  onDhcpChange: (checked: boolean) => void;
  onMikrotikChange: (checked: boolean) => void;
}

export const CircuitRequirements = ({
  staticIp,
  slash29,
  dhcp,
  mikrotikRequired,
  onStaticIpChange,
  onSlash29Change,
  onDhcpChange,
  onMikrotikChange
}: CircuitRequirementsProps) => {
  return (
    <div className="space-y-4">
      <Label>Quote Requirements</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="static-ip"
            checked={staticIp}
            onCheckedChange={(checked) => onStaticIpChange(checked as boolean)}
          />
          <Label htmlFor="static-ip" className="text-sm font-normal">
            /30 Static IP
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="slash-29"
            checked={slash29}
            onCheckedChange={(checked) => onSlash29Change(checked as boolean)}
          />
          <Label htmlFor="slash-29" className="text-sm font-normal">
            /29 Static IP
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="dhcp"
            checked={dhcp}
            onCheckedChange={(checked) => onDhcpChange(checked as boolean)}
          />
          <Label htmlFor="dhcp" className="text-sm font-normal">
            DHCP (No Static IP)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="mikrotik-required"
            checked={mikrotikRequired}
            onCheckedChange={(checked) => onMikrotikChange(checked as boolean)}
          />
          <Label htmlFor="mikrotik-required" className="text-sm font-normal">
            Router Required (Mikrotik)
          </Label>
        </div>
      </div>
    </div>
  );
};
