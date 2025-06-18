
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ExternalLink } from "lucide-react";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { useCarrierOptions } from "@/hooks/useCarrierOptions";
import { useVendorPriceSheets } from "@/hooks/useVendorPriceSheets";
import { useSpeeds } from "@/hooks/useSpeeds";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCarrierQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCarrier: (carrier: Omit<CarrierQuote, "id" | "circuit_quote_id">) => void;
}

export const AddCarrierQuoteDialog = ({ open, onOpenChange, onAddCarrier }: AddCarrierQuoteDialogProps) => {
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [speedId, setSpeedId] = useState("");
  const [customSpeed, setCustomSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [staticIp, setStaticIp] = useState(false);
  const [slash29, setSlash29] = useState(false);
  const [installFee, setInstallFee] = useState(false);
  const [siteSurveyNeeded, setSiteSurveyNeeded] = useState(false);

  const { vendors, categories, loading } = useCarrierOptions();
  const { priceSheets } = useVendorPriceSheets();
  const { speeds, loading: speedsLoading } = useSpeeds();
  const { toast } = useToast();

  console.log('Speeds data:', speeds, 'Loading:', speedsLoading);

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

  const resetForm = () => {
    setVendorId("");
    setCategoryId("");
    setSpeedId("");
    setCustomSpeed("");
    setPrice("");
    setTerm("");
    setNotes("");
    setStaticIp(false);
    setSlash29(false);
    setInstallFee(false);
    setSiteSurveyNeeded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSpeed = speedId === "custom" ? customSpeed : speeds.find(s => s.id === speedId)?.name;
    
    if (vendorId && categoryId && selectedSpeed) {
      const selectedVendor = vendors.find(v => v.id === vendorId);
      const selectedCategory = categories.find(c => c.id === categoryId);
      
      // Use vendor's color or default to blue
      const vendorColor = selectedVendor?.color || '#3B82F6';
      
      onAddCarrier({
        carrier: selectedVendor?.name || "",
        type: selectedCategory?.name || "",
        speed: selectedSpeed,
        price: price ? parseFloat(price) : 0,
        term,
        notes,
        color: vendorColor,
        static_ip: staticIp,
        slash_29: slash29,
        install_fee: installFee,
        site_survey_needed: siteSurveyNeeded
      });
      
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Carrier Quote</DialogTitle>
          <DialogDescription>
            Add a new carrier quote for comparison. Leave cost and term blank if waiting for vendor response.
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

          <div className="space-y-4">
            <Label>Options</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="static-ip"
                  checked={staticIp}
                  onCheckedChange={(checked) => setStaticIp(checked as boolean)}
                />
                <Label htmlFor="static-ip" className="text-sm font-normal">
                  Static IP
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="slash-29"
                  checked={slash29}
                  onCheckedChange={(checked) => setSlash29(checked as boolean)}
                />
                <Label htmlFor="slash-29" className="text-sm font-normal">
                  /29
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="install-fee"
                  checked={installFee}
                  onCheckedChange={(checked) => setInstallFee(checked as boolean)}
                />
                <Label htmlFor="install-fee" className="text-sm font-normal">
                  Install Fee
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="site-survey"
                  checked={siteSurveyNeeded}
                  onCheckedChange={(checked) => setSiteSurveyNeeded(checked as boolean)}
                />
                <Label htmlFor="site-survey" className="text-sm font-normal">
                  Site Survey Needed
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this quote (e.g., includes static IPs, installation fees, etc.)"
              rows={3}
            />
            <div className="text-xs text-gray-500">
              Note: After creating the quote, you can use the edit dialog to add detailed notes with file attachments.
            </div>
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
              Add Carrier Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
