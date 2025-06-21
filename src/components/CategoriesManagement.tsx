

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Edit, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/types/categories";
import { useAuth } from "@/context/AuthContext";

export const CategoriesManagement = () => {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } = useCategories();
  const { isAdmin } = useAuth();

  const handleEditCategory = (category: Category) => {
    if (!isAdmin) return;
    setSelectedCategory(category);
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = (categoryId: string, updates: Partial<Category>) => {
    updateCategory(categoryId, updates);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategory(categoryId);
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'Circuit':
        return 'bg-blue-100 text-blue-800';
      case 'Network':
        return 'bg-green-100 text-green-800';
      case 'Managed Services':
        return 'bg-purple-100 text-purple-800';
      case 'AI':
        return 'bg-orange-100 text-orange-800';
      case 'VOIP':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading categories...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <CardTitle>Categories</CardTitle>
              <Badge variant="outline" className="ml-2">
                {categories.length} categories
              </Badge>
              {!isAdmin && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  View Only
                </Badge>
              )}
            </div>
            {isAdmin && (
              <Button onClick={() => setIsAddCategoryOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No categories yet</p>
              {isAdmin ? (
                <>
                  <p className="text-sm mb-4">Add your first category to organize your items</p>
                  <Button onClick={() => setIsAddCategoryOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Category
                  </Button>
                </>
              ) : (
                <p className="text-sm">No categories have been created by administrators yet</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      {category.type && (
                        <Badge className={getTypeColor(category.type)}>
                          {category.type}
                        </Badge>
                      )}
                      {/* Only show minimum markup badge to admins */}
                      {isAdmin && category.minimum_markup !== undefined && category.minimum_markup > 0 && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          {category.minimum_markup}% min markup
                        </Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                    {/* Only show commission reduction info to admins */}
                    {isAdmin && category.minimum_markup !== undefined && category.minimum_markup > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Agents can reduce markup but commission decreases proportionally
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <AddCategoryDialog
            open={isAddCategoryOpen}
            onOpenChange={setIsAddCategoryOpen}
            onAddCategory={addCategory}
          />

          <EditCategoryDialog
            open={isEditCategoryOpen}
            onOpenChange={setIsEditCategoryOpen}
            onUpdateCategory={handleUpdateCategory}
            category={selectedCategory}
          />
        </>
      )}
    </>
  );
};

