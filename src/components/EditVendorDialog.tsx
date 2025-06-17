
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vendor } from "@/types/vendors";

interface EditVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateVendor: (vendorId: string, updates: Partial<Vendor>) => void;
  vendor: Vendor | null;
}

export const EditVendorDialog = ({ open, onOpenChange, onUpdateVendor, vendor }: EditVendorDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repName, setRepName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [salesModel, setSalesModel] = useState<'agent' | 'partner' | 'wholesale'>('agent');

  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setDescription(vendor.description || "");
      setRepName(vendor.rep_name || "");
      setEmail(vendor.email || "");
      setPhone(vendor.phone || "");
      setSalesModel(vendor.sales_model || 'agent');
    }
  }, [vendor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vendor && name) {
      onUpdateVendor(vendor.id, {
        name,
        description: description || undefined,
        rep_name: repName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        sales_model: salesModel,
      });
      
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>
            Update the vendor details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Vendor Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter vendor description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-repName">Rep Name</Label>
              <Input
                id="edit-repName"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="Representative name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-salesModel">Sales Model</Label>
              <Select value={salesModel} onValueChange={(value: 'agent' | 'partner' | 'wholesale') => setSalesModel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales model" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!name}
            >
              Update Vendor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
