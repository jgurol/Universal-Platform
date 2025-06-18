
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Item } from "@/types/items";
import { useCategories } from "@/hooks/useCategories";
import { useVendors } from "@/hooks/useVendors";
import { ReactQuillEditor } from "@/components/ReactQuillEditor";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: Omit<Item, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

export const AddItemDialog = ({ open, onOpenChange, onAddItem }: AddItemDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [chargeType, setChargeType] = useState("MRC");
  const [categoryId, setCategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [sku, setSku] = useState("");
  const { categories } = useCategories();
  const { vendors } = useVendors();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && price) {
      onAddItem({
        name,
        description: description || undefined,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        charge_type: chargeType,
        category_id: categoryId || undefined,
        vendor_id: vendorId || undefined,
        sku: sku || undefined,
        is_active: true
      });
      
      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setCost("");
      setChargeType("MRC");
      setCategoryId("");
      setVendorId("");
      setSku("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new product or service item to your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <ReactQuillEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter item description..."
              className="min-h-[200px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="charge-type">Charge Type</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="charge-toggle" className="text-sm">NRC</Label>
              <Switch
                id="charge-toggle"
                checked={chargeType === "MRC"}
                onCheckedChange={(checked) => setChargeType(checked ? "MRC" : "NRC")}
              />
              <Label htmlFor="charge-toggle" className="text-sm">MRC</Label>
            </div>
            <p className="text-xs text-gray-500">
              {chargeType === "MRC" ? "Monthly Recurring Charge" : "Non-Recurring Charge"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Enter SKU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!name || !price}
            >
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
