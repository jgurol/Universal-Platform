
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building, MapPin, Zap, DollarSign } from "lucide-react";
import { AddCircuitQuoteDialog } from "@/components/AddCircuitQuoteDialog";
import { CircuitQuoteCard } from "@/components/CircuitQuoteCard";

export interface CircuitQuote {
  id: string;
  client: string;
  location: string;
  suite: string;
  creationDate: string;
  carriers: CarrierQuote[];
  status: 'researching' | 'quoted' | 'published';
}

export interface CarrierQuote {
  id: string;
  carrier: string;
  type: string;
  speed: string;
  price: number;
  notes: string;
  term: string;
  color: string;
}

export const CircuitQuotesManagement = () => {
  const [quotes, setQuotes] = useState<CircuitQuote[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sample data similar to the Monday.com structure shown in the image
  useEffect(() => {
    const sampleQuotes: CircuitQuote[] = [
      {
        id: "1",
        client: "Valley Eye Center Surgical Medical Group",
        location: "Westlake Village, CA",
        suite: "120",
        creationDate: "May 13, 2025",
        status: "researching",
        carriers: [
          {
            id: "1",
            carrier: "Frontier",
            type: "Broadband",
            speed: "2Gx2G",
            price: 143.99,
            notes: "36 months; Pricing includes 5 static IP",
            term: "36 months",
            color: "bg-green-100 text-green-800"
          },
          {
            id: "2",
            carrier: "Frontier",
            type: "Fiber",
            speed: "50x50M",
            price: 340,
            notes: "36 Months",
            term: "36 months",
            color: "bg-green-100 text-green-800"
          },
          {
            id: "3",
            carrier: "Frontier",
            type: "Fiber",
            speed: "100x100M",
            price: 400,
            notes: "36 Months",
            term: "36 months",
            color: "bg-green-100 text-green-800"
          },
          {
            id: "4",
            carrier: "Geolinks",
            type: "Fixed Wireless",
            speed: "30x30M",
            price: 310,
            notes: "36 mo; Includes 1 static IP",
            term: "36 months",
            color: "bg-purple-100 text-purple-800"
          },
          {
            id: "5",
            carrier: "Geolinks",
            type: "Fixed Wireless",
            speed: "50x50M",
            price: 325,
            notes: "36 mo; Includes 1 static IP",
            term: "36 months",
            color: "bg-purple-100 text-purple-800"
          }
        ]
      }
    ];
    setQuotes(sampleQuotes);
  }, []);

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addQuote = (newQuote: Omit<CircuitQuote, "id">) => {
    const quote: CircuitQuote = {
      ...newQuote,
      id: Date.now().toString()
    };
    setQuotes(prev => [quote, ...prev]);
  };

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
              <SelectItem value="researching">Researching</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          New Circuit Quote
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-gray-600">Researching</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'researching').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quoted</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'quoted').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'published').length}</p>
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
              quote={quote}
              onUpdate={(updatedQuote) => {
                setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
              }}
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
