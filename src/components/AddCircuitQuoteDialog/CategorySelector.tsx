
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CategorySelectorProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (category: string, checked: boolean) => void;
}

export const CategorySelector = ({ categories, selectedCategories, onCategoryChange }: CategorySelectorProps) => {
  return (
    <div className="space-y-4">
      <Label>Circuit Categories</Label>
      <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
        {categories.map((category) => (
          <div key={category} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category}`}
              checked={selectedCategories.includes(category)}
              onCheckedChange={(checked) => onCategoryChange(category, checked as boolean)}
            />
            <Label 
              htmlFor={`category-${category}`} 
              className="text-sm font-normal capitalize"
            >
              {category}
            </Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Selected: {selectedCategories.join(", ")}
      </p>
    </div>
  );
};
