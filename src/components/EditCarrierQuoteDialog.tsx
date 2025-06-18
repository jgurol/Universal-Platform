import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, ExternalLink, MessageSquare } from "lucide-react";
import { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { useCarrierOptions } from "@/hooks/useCarrierOptions";
import { useVendorPriceSheets } from "@/hooks/useVendorPriceSheets";
import { useSpeeds } from "@/hooks/useSpeeds";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CarrierQuoteNotesDialog } from "@/components/CarrierQuoteNotesDialog";

interface EditCarrierQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrier: CarrierQuote;
  onUpdateCarrier: (carrier: CarrierQuote) => void;
}

export const EditCarrierQuoteDialog = ({ open, onOpenChange, carrier, onUpdateCarrier }: EditCarrierQuoteDialogProps) => {
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [speedId, setSpeedId] = useState("");
  const [customSpeed, setCustomSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  const { vendors, categories, loading } = useCarrierOptions();
  const { priceSheets } = useVendorPriceSheets();
  const { speeds, loading: speedsLoading } = useSpeeds();
  const { toast } = useToast();

  // Filter price sheets for the selected vendor
  const vendorPriceSheets = priceSheets.filter(sheet => sheet.vendor_id === vendorId);

  const handleOpenPriceSheet = async (priceSheet: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('vendor-price-sheets')
        .createSignedUrl(priceSheet.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        toast({
          title: "Error",
          description: "Failed to open price sheet",
          variant: "destructive"
        });
        return;
      }

      // Open in popup window
      const popup = window.open(
        data.signedUrl, 
        'priceSheet',
        'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
      );
      
      if (!popup) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to view price sheets",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error opening price sheet:', error);
      toast({
        title: "Error",
        description: "Failed to open price sheet",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (carrier && vendors.length > 0 && categories.length > 0 && speeds.length > 0) {
      // Find the vendor and category IDs based on the current names
      const foundVendor = vendors.find(v => v.name === carrier.carrier);
      const foundCategory = categories.find(c => c.name === carrier.type);
      const foundSpeed = speeds.find(s => s.name === carrier.speed);
      
      setVendorId(foundVendor?.id || "");
      setCategoryId(foundCategory?.id || "");
      
      if (foundSpeed) {
        setSpeedId(foundSpeed.id);
        setCustomSpeed("");
      } else {
        // If speed is not in predefined options, treat as custom
        setSpeedId("custom");
        setCustomSpeed(carrier.speed);
      }
      
      setPrice(carrier.price > 0 ? carrier.price.toString() : "");
      setTerm(carrier.term);
      setNotes(carrier.notes);
    }
  }, [carrier, vendors, categories, speeds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSpeed = speedId === "custom" ? customSpeed : speeds.find(s => s.id === speedId)?.name;
    
    if (vendorId && categoryId && selectedSpeed) {
      const selectedVendor = vendors.find(v => v.id === vendorId);
      const selectedCategory = categories.find(c => c.id === categoryId);
      
      // Use vendor's color or default to blue
      const vendorColor = selectedVendor?.color || '#3B82F6';
      
      onUpdateCarrier({
        ...carrier,
        carrier: selectedVendor?.name || "",
        type: selectedCategory?.name || "",
        speed: selectedSpeed,
        price: price ? parseFloat(price) : 0,
        term,
        notes,
        color: vendorColor
      });
      
      onOpenChange(false);
    }
  };

  const handleNotesUpdate = (updatedNotes: string) => {
    setNotes(updatedNotes);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Carrier Quote</DialogTitle>
            <DialogDescription>
              Update the carrier quote information. Leave cost and term blank if waiting for vendor response.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vendor">Carrier (Required)</Label>
                {vendorId && vendorPriceSheets.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" type="button">
                        <FileText className="h-4 w-4 mr-1" />
                        Price Sheets ({vendorPriceSheets.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white z-50">
                      {vendorPriceSheets.map((sheet) => (
                        <DropdownMenuItem 
                          key={sheet.id}
                          onClick={() => handleOpenPriceSheet(sheet)}
                          className="cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {sheet.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <Select value={vendorId} onValueChange={setVendorId} required>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading vendors..." : "Select vendor"} />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: vendor.color || '#3B82F6' }}
                        />
                        {vendor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Circuit Type (Required)</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading types..." : "Select circuit type"} />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Speed (Required)</Label>
              <Select value={speedId} onValueChange={setSpeedId} required>
                <SelectTrigger>
                  <SelectValue placeholder={speedsLoading ? "Loading speeds..." : "Select speed"} />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {speeds.map((speed) => (
                    <SelectItem key={speed.id} value={speed.id}>
                      <div className="flex flex-col">
                        <span>{speed.name}</span>
                        {speed.description && (
                          <span className="text-xs text-gray-500">{speed.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Speed</SelectItem>
                </SelectContent>
              </Select>
              
              {speedId === "custom" && (
                <Input
                  value={customSpeed}
                  onChange={(e) => setCustomSpeed(e.target.value)}
                  placeholder="Enter custom speed (e.g., 250x250M)"
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Cost</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Leave blank if waiting for quote"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Contract Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Leave blank if waiting for quote" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="Month to Month">Month to Month</SelectItem>
                  <SelectItem value="12 months">12 months</SelectItem>
                  <SelectItem value="24 months">24 months</SelectItem>
                  <SelectItem value="36 months">36 months</SelectItem>
                  <SelectItem value="60 months">60 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNotesDialogOpen(true)}
                  className="w-full justify-start"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {notes ? "View/Edit Notes" : "Add Notes"}
                </Button>
              </div>
              {notes && (
                <div className="text-xs text-gray-500 mt-1">
                  {notes.length > 100 ? `${notes.substring(0, 100)}...` : notes}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!vendorId || !categoryId || !speedId || loading || speedsLoading || (speedId === "custom" && !customSpeed)}
              >
                Update Carrier Quote
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CarrierQuoteNotesDialog
        open={isNotesDialogOpen}
        onOpenChange={setIsNotesDialogOpen}
        carrierId={carrier.id}
        carrierName={carrier.carrier}
        initialNotes={notes}
        onNotesUpdate={handleNotesUpdate}
      />
    </>
  );
};
