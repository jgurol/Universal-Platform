
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInfo } from "@/types/index";

interface ClientSelectorProps {
  clientInfos: ClientInfo[];
  clientId: string;
  onClientChange: (clientId: string) => void;
}

export const ClientSelector = ({ clientInfos, clientId, onClientChange }: ClientSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="client">Client (Required)</Label>
      <Select value={clientId} onValueChange={onClientChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a client" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {clientInfos.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {clientInfos.length === 0 && (
        <p className="text-sm text-red-500">No clients available. Please add a client first.</p>
      )}
    </div>
  );
};
