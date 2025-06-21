
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/types/categories";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void;
  category: Category | null;
}

export const EditCategoryDialog = ({ open, onOpenChange, onUpdateCategory, category }: EditCategoryDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'Circuit' | 'Network' | 'Managed Services' | 'AI' | 'VOIP'>('Network');
  const [minimumMarkup, setMinimumMarkup] = useState<number>(0);
  const [defaultSelected, setDefaultSelected] = useState<boolean>(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setType(category.type || 'Network');
      setMinimumMarkup(category.minimum_markup || 0);
      setDefaultSelected(category.default_selected || false);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category && name.trim()) {
      onUpdateCategory(category.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        minimum_markup: minimumMarkup,
        default_selected: defaultSelected,
      });
      
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the details of this category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category-name">Name *</Label>
            <Input
              id="edit-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category-type">Type *</Label>
            <Select value={type} onValueChange={(value: 'Circuit' | 'Network' | 'Managed Services' | 'AI' | 'VOIP') => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Circuit">Circuit</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
                <SelectItem value="Managed Services">Managed Services</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="VOIP">VOIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-minimum-markup">Minimum Markup (%)</Label>
            <Input
              id="edit-minimum-markup"
              type="number"
              step="0.01"
              min="0"
              value={minimumMarkup}
              onChange={(e) => setMinimumMarkup(parseFloat(e.target.value) || 0)}
              placeholder="Enter minimum markup percentage"
            />
            <p className="text-xs text-gray-500">
              Agents can reduce markup below this but it will reduce their commission proportionally
            </p>
          </div>

          {type === 'Circuit' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-default-selected"
                checked={defaultSelected}
                onCheckedChange={(checked) => setDefaultSelected(checked as boolean)}
              />
              <Label htmlFor="edit-default-selected" className="text-sm font-normal">
                Default selected for circuit quotes
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-category-description">Description</Label>
            <Textarea
              id="edit-category-description"
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
              Update Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
