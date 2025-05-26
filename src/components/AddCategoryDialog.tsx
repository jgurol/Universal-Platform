
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/types/categories";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCategory: (category: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

export const AddCategoryDialog = ({ open, onOpenChange, onAddCategory }: AddCategoryDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'Circuit' | 'Network' | 'Managed Services' | 'AI'>('Network');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddCategory({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        is_active: true
      });
      
      // Reset form
      setName("");
      setDescription("");
      setType('Network');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category for organizing your items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name *</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-type">Type *</Label>
            <Select value={type} onValueChange={(value: 'Circuit' | 'Network' | 'Managed Services' | 'AI') => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Circuit">Circuit</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
                <SelectItem value="Managed Services">Managed Services</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter category description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!name.trim()}
            >
              Add Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
