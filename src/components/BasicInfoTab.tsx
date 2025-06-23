
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Client, ClientInfo } from "@/pages/Index";

interface BasicInfoTabProps {
  clientId: string;
  setClientId: (value: string) => void;
  clientInfoId: string;
  setClientInfoId: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  clients: Client[];
  clientInfos: ClientInfo[];
  filteredClientInfos: ClientInfo[];
}

export const BasicInfoTab = ({
  clientId,
  setClientId,
  clientInfoId,
  setClientInfoId,
  amount,
  setAmount,
  date,
  setDate,
  description,
  setDescription,
  clients,
  clientInfos,
  filteredClientInfos
}: BasicInfoTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clientInfo">Client Company</Label>
        <Select value={clientInfoId} onValueChange={setClientInfoId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a client (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {clientInfos.map((clientInfo) => (
              <SelectItem key={clientInfo.id} value={clientInfo.id}>
                {clientInfo.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Show agent information only when a client is assigned */}
      {clientId && (
        <div className="space-y-2">
          <Label htmlFor="client">Agent</Label>
          <div className="flex items-center gap-2">
            <div className="border rounded-md px-3 py-2 flex-1 bg-muted text-muted-foreground">
              {clients.find(client => client.id === clientId)?.companyName || 
               clients.find(client => client.id === clientId)?.name || "Selected Agent"}
            </div>
            {/* Clear agent button */}
            <Button 
              type="button" 
              variant="outline" 
              className="h-10"
              onClick={() => {
                if (clientInfoId && clientInfoId !== "none") {
                  // If client is assigned, show confirmation or warning
                  if (confirm("Clearing the agent will also clear the client company. Continue?")) {
                    setClientId("");
                    setClientInfoId("none");
                  }
                } else {
                  setClientId("");
                }
              }}
            >
              Clear
            </Button>
          </div>
          {clientId && (
            <div className="text-xs text-gray-500">
              Contact: {clients.find(c => c.id === clientId)?.name}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date">Transaction Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter transaction description"
        />
      </div>
    </div>
  );
};
