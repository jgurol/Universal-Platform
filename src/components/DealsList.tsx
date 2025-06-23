import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter } from "lucide-react";
import { DealRegistrationCard } from "@/components/DealRegistrationCard";
import { AddDealDialog } from "@/components/AddDealDialog";
import { EditDealDialog } from "@/components/EditDealDialog";
import { ClientInfo } from "@/types/index";

interface DealsListProps {
  clientInfos: ClientInfo[];
  onAddDeal: (deal: any) => void;
  onUpdateDeal: (deal: any) => void;
  onDeleteDeal: (dealId: string) => void;
  deals: any[];
}

export const DealsList = ({
  clientInfos,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  deals
}: DealsListProps) => {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isEditDealOpen, setIsEditDealOpen] = useState(false);
  const [currentDeal, setCurrentDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredDeals = deals.filter((deal) => {
    const searchMatch =
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.client_info?.company_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch =
      filterStatus === "all" || deal.status === filterStatus;

    return searchMatch && statusMatch;
  });

  const handleEditClick = (deal) => {
    setCurrentDeal(deal);
    setIsEditDealOpen(true);
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <CardTitle className="text-lg font-semibold">Deal Registrations</CardTitle>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search deals..."
              className="pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute top-2 right-2 h-5 w-5 text-gray-500" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new_pricing">New Pricing</SelectItem>
              <SelectItem value="researching">Researching</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddDealOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredDeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No deals found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredDeals.map((deal) => (
              <DealRegistrationCard
                key={deal.id}
                deal={deal}
                clientInfos={clientInfos}
                onEditClick={() => handleEditClick(deal)}
                onDeleteDeal={onDeleteDeal}
              />
            ))}
          </div>
        )}
      </CardContent>

      <AddDealDialog
        open={isAddDealOpen}
        onOpenChange={setIsAddDealOpen}
        onAddDeal={onAddDeal}
        clientInfos={clientInfos}
      />

      <EditDealDialog
        deal={currentDeal}
        open={isEditDealOpen}
        onOpenChange={setIsEditDealOpen}
        onUpdateDeal={onUpdateDeal}
        onDeleteDeal={onDeleteDeal}
        clientInfos={clientInfos}
      />
    </Card>
  );
};
