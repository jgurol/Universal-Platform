import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FileText, ExternalLink, MessageSquare, X } from "lucide-react";
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
      
      // Extract site survey color from notes if present
      let cleanNotes = carrier.notes;
      let surveyColor = "red";
      
      if (carrier.notes && carrier.notes.includes("Site Survey:")) {
        const parts = carrier.notes.split("Site Survey:");
        if (parts.length > 1) {
          const colorPart = parts[1].trim().toLowerCase();
          if (colorPart.startsWith("red") || colorPart.startsWith("yellow") || colorPart.startsWith("orange") || colorPart.startsWith("green")) {
            surveyColor = colorPart.split(" ")[0];
          }
          cleanNotes = parts[0].replace(" | ", "").trim();
        }
      }
      
      setNotes(cleanNotes);
      setSiteSurveyColor(surveyColor);
      setInstallFee(carrier.install_fee || false);
      setInstallFeeAmount(carrier.install_fee_amount > 0 ? carrier.install_fee_amount.toString() : "");
      setSiteSurveyNeeded(carrier.site_survey_needed || false);
      setNoService(carrier.no_service || false);
      setIncludesStaticIp(carrier.static_ip || false);
      setStaticIpFeeAmount(carrier.static_ip_fee_amount > 0 ? carrier.static_ip_fee_amount.toString() : "");
      setIncludes5StaticIp((carrier as any).static_ip_5 || false);
      setStaticIp5FeeAmount((carrier as any).static_ip_5_fee_amount > 0 ? (carrier as any).static_ip_5_fee_amount.toString() : "");
      
      setOtherCosts((carrier as any).other_costs > 0 ? (carrier as any).other_costs.toString() : "");
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
      } as CarrierQuote);
      
      onOpenChange(false);
    }
  };

  const handleNotesUpdate = (updatedNotes: string) => {
    setNotes(updatedNotes);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-w-5xl ml-auto">
          <DrawerHeader className="flex items-center justify-between border-b">
            <DrawerTitle>Edit Carrier Quote</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Carrier Information */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Carrier Information</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="vendor" className="text-xs">Carrier (Required)</Label>
                      {vendorId && vendorPriceSheets.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" type="button" className="h-7 text-xs">
                              <FileText className="h-3 w-3 mr-1" />
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
                      <SelectTrigger className="h-8">
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

                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-xs">Circuit Type (Required)</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                      <SelectTrigger className="h-8">
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
                </div>

                {/* Speed Selection */}
                <div className="space-y-1">
                  <Label htmlFor="speed" className="text-xs">Speed (Required)</Label>
                  <Select value={speedId} onValueChange={setSpeedId} required>
                    <SelectTrigger className="h-8">
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
                      className="h-8 mt-1"
                      required
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Pricing Information */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Pricing & Contract</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="price" className="text-xs">Monthly Cost</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Leave blank if waiting for quote"
                      className="h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="other-costs" className="text-xs">Other Monthly Costs</Label>
                    <Input
                      id="other-costs"
                      type="number"
                      step="0.01"
                      value={otherCosts}
                      onChange={(e) => setOtherCosts(e.target.value)}
                      placeholder="Additional MRC costs"
                      className="h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="term" className="text-xs">Contract Term</Label>
                    <Select value={term} onValueChange={setTerm}>
                      <SelectTrigger className="h-8">
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
                </div>
              </div>

              <Separator />

              {/* Installation & Setup Fees */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Installation & Setup</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="install-fee"
                        checked={installFee}
                        onCheckedChange={(checked) => setInstallFee(checked as boolean)}
                      />
                      <Label htmlFor="install-fee" className="text-xs font-normal">
                        Installation Fee
                      </Label>
                    </div>
                    
                    {installFee && (
                      <div className="ml-6">
                        <Label htmlFor="install-fee-amount" className="text-xs text-gray-600">
                          Installation Fee Amount
                        </Label>
                        <Input
                          id="install-fee-amount"
                          type="number"
                          step="0.01"
                          value={installFeeAmount}
                          onChange={(e) => setInstallFeeAmount(e.target.value)}
                          placeholder="Enter fee amount"
                          className="h-8 mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="site-survey"
                        checked={siteSurveyNeeded}
                        onCheckedChange={(checked) => setSiteSurveyNeeded(checked as boolean)}
                      />
                      <Label htmlFor="site-survey" className="text-xs font-normal">
                        Site Survey Needed
                      </Label>
                    </div>

                    {siteSurveyNeeded && (
                      <div className="ml-6 space-y-1">
                        <Label className="text-xs text-gray-600">Site Survey Priority</Label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant={siteSurveyColor === "red" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSiteSurveyColor("red")}
                            className={`h-7 px-2 text-xs ${siteSurveyColor === "red" ? "bg-red-500 hover:bg-red-600" : "border-red-500 text-red-500 hover:bg-red-50"}`}
                          >
                            Red
                          </Button>
                          <Button
                            type="button"
                            variant={siteSurveyColor === "yellow" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSiteSurveyColor("yellow")}
                            className={`h-7 px-2 text-xs ${siteSurveyColor === "yellow" ? "bg-yellow-500 hover:bg-yellow-600" : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"}`}
                          >
                            Yellow
                          </Button>
                          <Button
                            type="button"
                            variant={siteSurveyColor === "orange" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSiteSurveyColor("orange")}
                            className={`h-7 px-2 text-xs ${siteSurveyColor === "orange" ? "bg-orange-500 hover:bg-orange-600" : "border-orange-500 text-orange-600 hover:bg-orange-50"}`}
                          >
                            Orange
                          </Button>
                          <Button
                            type="button"
                            variant={siteSurveyColor === "green" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSiteSurveyColor("green")}
                            className={`h-7 px-2 text-xs ${siteSurveyColor === "green" ? "bg-green-500 hover:bg-green-600" : "border-green-500 text-green-600 hover:bg-green-50"}`}
                          >
                            Green
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Static IP Options */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Static IP Options</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includes-static-ip"
                        checked={includesStaticIp}
                        onCheckedChange={(checked) => setIncludesStaticIp(checked as boolean)}
                      />
                      <Label htmlFor="includes-static-ip" className="text-xs font-normal">
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
                          className="h-8 mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includes-5-static-ip"
                        checked={includes5StaticIp}
                        onCheckedChange={(checked) => setIncludes5StaticIp(checked as boolean)}
                      />
                      <Label htmlFor="includes-5-static-ip" className="text-xs font-normal">
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
                          className="h-8 mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Service Status & Notes */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Service Status & Notes</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no-service"
                      checked={noService}
                      onCheckedChange={(checked) => setNoService(checked as boolean)}
                    />
                    <Label htmlFor="no-service" className="text-xs font-normal">
                      No Service Available
                    </Label>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="notes" className="text-xs">Additional Notes</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsNotesDialogOpen(true)}
                        className="w-full justify-start h-8 text-xs"
                      >
                        <MessageSquare className="h-3 w-3 mr-2" />
                        {notes ? "View/Edit Notes" : "Add Notes"}
                      </Button>
                    </div>
                    {notes && (
                      <div className="text-xs text-gray-500 mt-1">
                        {notes.length > 100 ? `${notes.substring(0, 100)}...` : notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8 px-3 text-sm">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="h-8 px-3 text-sm bg-purple-600 hover:bg-purple-700"
                  disabled={!vendorId || !categoryId || !speedId || loading || speedsLoading || (speedId === "custom" && !customSpeed)}
                >
                  Update Carrier Quote
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>

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
