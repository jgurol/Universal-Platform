import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ExternalLink } from "lucide-react";
import { CarrierQuote } from "@/hooks/useCircuitQuotes";
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
  const [installFee, setInstallFee] = useState(false);
  const [installFeeAmount, setInstallFeeAmount] = useState("");
  const [siteSurveyNeeded, setSiteSurveyNeeded] = useState(false);
  const [siteSurveyColor, setSiteSurveyColor] = useState("red");
  const [noService, setNoService] = useState(false);
  const [includesStaticIp, setIncludesStaticIp] = useState(false);
  const [staticIpFeeAmount, setStaticIpFeeAmount] = useState("");
  const [includes5StaticIp, setIncludes5StaticIp] = useState(false);
  const [staticIp5FeeAmount, setStaticIp5FeeAmount] = useState("");
  const [otherCosts, setOtherCosts] = useState("");

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

  const resetForm = () => {
    setVendorId("");
    setCategoryId("");
    setSpeedId("");
    setCustomSpeed("");
    setPrice("");
    setTerm("");
    setNotes("");
    setInstallFee(false);
    setInstallFeeAmount("");
    setSiteSurveyNeeded(false);
    setSiteSurveyColor("red");
    setNoService(false);
    setIncludesStaticIp(false);
    setStaticIpFeeAmount("");
    setIncludes5StaticIp(false);
    setStaticIp5FeeAmount("");
    setOtherCosts("");
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
        notes: siteSurveyNeeded ? `${notes}${notes ? ' | ' : ''}Site Survey: ${siteSurveyColor.toUpperCase()}` : notes,
        color: vendorColor,
        install_fee: installFee,
        install_fee_amount: installFeeAmount ? parseFloat(installFeeAmount) : 0,
        site_survey_needed: siteSurveyNeeded,
        no_service: noService,
        static_ip: includesStaticIp,
        static_ip_fee_amount: staticIpFeeAmount ? parseFloat(staticIpFeeAmount) : 0,
        static_ip_5: includes5StaticIp,
        static_ip_5_fee_amount: staticIp5FeeAmount ? parseFloat(staticIp5FeeAmount) : 0,
        other_costs: otherCosts ? parseFloat(otherCosts) : 0
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
            Add a new carrier quote. Leave cost and term blank if waiting for vendor response.
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
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
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
                
                {installFee && (
                  <div className="ml-6">
                    <Label htmlFor="install-fee-amount" className="text-xs text-gray-600">
                      Install Fee Amount
                    </Label>
                    <Input
                      id="install-fee-amount"
                      type="number"
                      step="0.01"
                      value={installFeeAmount}
                      onChange={(e) => setInstallFeeAmount(e.target.value)}
                      placeholder="Enter fee amount"
                      className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}
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
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="no-service"
                  checked={noService}
                  onCheckedChange={(checked) => setNoService(checked as boolean)}
                />
                <Label htmlFor="no-service" className="text-sm font-normal">
                  No Service
                </Label>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includes-static-ip"
                    checked={includesStaticIp}
                    onCheckedChange={(checked) => setIncludesStaticIp(checked as boolean)}
                  />
                  <Label htmlFor="includes-static-ip" className="text-sm font-normal">
                    1 Static IP (/30)
                  </Label>
                </div>
                
                {includesStaticIp && (
                  <div className="ml-6">
                    <Label htmlFor="static-ip-fee-amount" className="text-xs text-gray-600">
                      Static IP Fee Amount
                    </Label>
                    <Input
                      id="static-ip-fee-amount"
                      type="number"
                      step="0.01"
                      value={staticIpFeeAmount}
                      onChange={(e) => setStaticIpFeeAmount(e.target.value)}
                      placeholder="Enter fee amount"
                      className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includes-5-static-ip"
                    checked={includes5StaticIp}
                    onCheckedChange={(checked) => setIncludes5StaticIp(checked as boolean)}
                  />
                  <Label htmlFor="includes-5-static-ip" className="text-sm font-normal">
                    5 Static IP (/29)
                  </Label>
                </div>
                
                {includes5StaticIp && (
                  <div className="ml-6">
                    <Label htmlFor="static-ip-5-fee-amount" className="text-xs text-gray-600">
                      5 Static IP Fee Amount
                    </Label>
                    <Input
                      id="static-ip-5-fee-amount"
                      type="number"
                      step="0.01"
                      value={staticIp5FeeAmount}
                      onChange={(e) => setStaticIp5FeeAmount(e.target.value)}
                      placeholder="Enter fee amount"
                      className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {siteSurveyNeeded && (
              <div className="space-y-2 mt-4">
                <Label>Site Survey Priority</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={siteSurveyColor === "red" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSiteSurveyColor("red")}
                    className={siteSurveyColor === "red" ? "bg-red-500 hover:bg-red-600" : "border-red-500 text-red-500 hover:bg-red-50"}
                  >
                    Red
                  </Button>
                  <Button
                    type="button"
                    variant={siteSurveyColor === "yellow" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSiteSurveyColor("yellow")}
                    className={siteSurveyColor === "yellow" ? "bg-yellow-500 hover:bg-yellow-600" : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"}
                  >
                    Yellow
                  </Button>
                  <Button
                    type="button"
                    variant={siteSurveyColor === "orange" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSiteSurveyColor("orange")}
                    className={siteSurveyColor === "orange" ? "bg-orange-500 hover:bg-orange-600" : "border-orange-500 text-orange-600 hover:bg-orange-50"}
                  >
                    Orange
                  </Button>
                  <Button
                    type="button"
                    variant={siteSurveyColor === "green" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSiteSurveyColor("green")}
                    className={siteSurveyColor === "green" ? "bg-green-500 hover:bg-green-600" : "border-green-500 text-green-600 hover:bg-green-50"}
                  >
                    Green
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="other-costs">Other MRC Cost</Label>
            <Input
              id="other-costs"
              type="number"
              step="0.01"
              value={otherCosts}
              onChange={(e) => setOtherCosts(e.target.value)}
              placeholder="Enter additional MRC costs"
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or comments"
            />
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
