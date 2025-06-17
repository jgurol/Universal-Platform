
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building, DollarSign, Zap, Loader2, CheckCircle, Clock } from "lucide-react";
import { AddCircuitQuoteDialog } from "@/components/AddCircuitQuoteDialog";
import { CircuitQuoteCard } from "@/components/CircuitQuoteCard";
import { useCircuitQuotes } from "@/hooks/useCircuitQuotes";

// Re-export interfaces for backward compatibility
export type { CircuitQuote, CarrierQuote } from "@/hooks/useCircuitQuotes";

export const CircuitQuotesManagement = () => {
  const { 
    quotes, 
    loading, 
    addQuote, 
    updateQuote, 
    deleteQuote,
    addCarrierQuote, 
    updateCarrierQuote, 
    deleteCarrierQuote 
  } = useCircuitQuotes();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateQuote = (updatedQuote: any) => {
    // Transform the quote to match database format
    const quoteForUpdate = {
      ...updatedQuote,
      client_name: updatedQuote.client || updatedQuote.client_name,
      created_at: updatedQuote.creationDate || updatedQuote.created_at
    };
    updateQuote(quoteForUpdate);
  };

  const handleAddCarrier = (quoteId: string, carrierData: any) => {
    addCarrierQuote(quoteId, carrierData);
  };

  const handleUpdateCarrier = (carrierData: any) => {
    updateCarrierQuote(carrierData);
  };

  const handleDeleteQuote = (quoteId: string) => {
    deleteQuote(quoteId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading circuit quotes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by client or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          New Circuit Quote
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold">{quotes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Pricing</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'new_pricing').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Researching</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'researching').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sent to Customer</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'sent_to_customer').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Circuit Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No circuit quotes found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first circuit quote to research carrier pricing"}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Circuit Quote
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredQuotes.map((quote) => (
            <CircuitQuoteCard
              key={quote.id}
              quote={{
                ...quote,
                client: quote.client_name,
                creationDate: quote.created_at
              }}
              onUpdate={handleUpdateQuote}
              onAddCarrier={(carrierData) => handleAddCarrier(quote.id, carrierData)}
              onUpdateCarrier={handleUpdateCarrier}
              onDeleteCarrier={deleteCarrierQuote}
              onDeleteQuote={handleDeleteQuote}
            />
          ))
        )}
      </div>

      <AddCircuitQuoteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddQuote={addQuote}
      />
    </div>
  );
};
