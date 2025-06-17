
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

interface CircuitQuotesHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddQuote: () => void;
}

export const CircuitQuotesHeader = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddQuote
}: CircuitQuotesHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by client or location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new_pricing">New Pricing</SelectItem>
            <SelectItem value="researching">Researching</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button onClick={onAddQuote} className="bg-purple-600 hover:bg-purple-700">
        <Plus className="h-4 w-4 mr-2" />
        New Circuit Quote
      </Button>
    </div>
  );
};
