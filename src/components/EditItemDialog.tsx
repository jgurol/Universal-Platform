
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Item } from "@/types/items";
import { useCategories } from "@/hooks/useCategories";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateItem: (itemId: string, updates: Partial<Item>) => void;
  item: Item | null;
}

export const EditItemDialog = ({ open, onOpenChange, onUpdateItem, item }: EditItemDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [chargeType, setChargeType] = useState("MRC");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const { categories } = useCategories();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || "");
      setPrice(item.price.toString());
      setCost(item.cost.toString());
      setChargeType(item.charge_type || "MRC");
      setCategoryId(item.category_id || "");
      setSku(item.sku || "");
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item && name && price) {
      onUpdateItem(item.id, {
        name,
        description: description || undefined,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        charge_type: chargeType,
        category_id: categoryId || undefined,
        sku: sku || undefined,
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
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details of this item.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost ($)</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($) *</Label>
              <Input
                id="edit-price"
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
            <Label htmlFor="edit-charge-type">Charge Type</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-charge-toggle" className="text-sm">NRC</Label>
              <Switch
                id="edit-charge-toggle"
                checked={chargeType === "MRC"}
                onCheckedChange={(checked) => setChargeType(checked ? "MRC" : "NRC")}
              />
              <Label htmlFor="edit-charge-toggle" className="text-sm">MRC</Label>
            </div>
            <p className="text-xs text-gray-500">
              {chargeType === "MRC" ? "Monthly Recurring Charge" : "Non-Recurring Charge"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Enter SKU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
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
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!name || !price}
            >
              Update Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
