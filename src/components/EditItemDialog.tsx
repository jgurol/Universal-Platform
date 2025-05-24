
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Item } from "@/types/items";

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
  const [mrc, setMrc] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || "");
      setPrice(item.price.toString());
      setMrc(item.mrc ? item.mrc.toString() : "");
      setCategory(item.category || "");
      setSku(item.sku || "");
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item && name && (price || mrc)) {
      onUpdateItem(item.id, {
        name,
        description: description || undefined,
        price: parseFloat(price) || 0,
        mrc: mrc ? parseFloat(mrc) : undefined,
        category: category || undefined,
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
              <Label htmlFor="edit-price">One-time Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-mrc">MRC ($)</Label>
              <Input
                id="edit-mrc"
                type="number"
                step="0.01"
                min="0"
                value={mrc}
                onChange={(e) => setMrc(e.target.value)}
                placeholder="0.00"
              />
            </div>
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
              <Input
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!name || (!price && !mrc)}
            >
              Update Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
