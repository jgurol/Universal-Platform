
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Edit, Trash2, Copy } from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useVendors } from "@/hooks/useVendors";
import { AddItemDialog } from "@/components/AddItemDialog";
import { EditItemDialog } from "@/components/EditItemDialog";
import { Badge } from "@/components/ui/badge";
import { Item } from "@/types/items";
import { useAuth } from "@/context/AuthContext";

export const ItemsManagement = () => {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { items, isLoading, addItem, updateItem, deleteItem } = useItems();
  const { categories } = useCategories();
  const { vendors } = useVendors();
  const { isAdmin } = useAuth();

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return null;
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name;
  };

  const getVendorName = (vendorId?: string) => {
    if (!vendorId) return null;
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name;
  };

  const handleEditItem = (item: Item) => {
    if (!isAdmin) return;
    setSelectedItem(item);
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<Item>) => {
    updateItem(itemId, updates);
    setSelectedItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItem(itemId);
    }
  };

  const handleCopyItem = (item: Item) => {
    if (!isAdmin) return;
    const copiedItem = {
      name: `${item.name} (Copy)`,
      description: item.description,
      price: item.price,
      cost: item.cost,
      charge_type: item.charge_type,
      category_id: item.category_id,
      vendor_id: item.vendor_id,
      sku: item.sku ? `${item.sku}-COPY` : undefined,
      is_active: true
    };
    addItem(copiedItem);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading items...</div>
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
              <Package className="h-5 w-5 text-blue-600" />
              <CardTitle>Items & Products</CardTitle>
              <Badge variant="outline" className="ml-2">
                {items.length} items
              </Badge>
              {!isAdmin && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  View Only
                </Badge>
              )}
            </div>
            {isAdmin && (
              <Button onClick={() => setIsAddItemOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No items yet</p>
              {isAdmin ? (
                <>
                  <p className="text-sm mb-4">Add your first product or service item to get started</p>
                  <Button onClick={() => setIsAddItemOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Item
                  </Button>
                </>
              ) : (
                <p className="text-sm">No items have been created by administrators yet</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {isAdmin && item.cost > 0 && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          Cost: ${item.cost.toFixed(2)}
                        </Badge>
                      )}
                      {item.price > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {item.charge_type === "MRC" ? "MRC" : "Price"}: ${item.price.toFixed(2)}{item.charge_type === "MRC" ? "/mo" : ""}
                        </Badge>
                      )}
                      {item.sku && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                          SKU: {item.sku}
                        </Badge>
                      )}
                      {item.charge_type && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {item.charge_type}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <div 
                        className="text-sm text-gray-600 mb-1 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {getCategoryName(item.category_id) && (
                        <span>Category: {getCategoryName(item.category_id)}</span>
                      )}
                      {getVendorName(item.vendor_id) && (
                        <span>Vendor: {getVendorName(item.vendor_id)}</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopyItem(item)}
                        title="Copy Item"
                        className="text-gray-500 hover:text-green-600"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteItem(item.id)}
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
          <AddItemDialog
            open={isAddItemOpen}
            onOpenChange={setIsAddItemOpen}
            onAddItem={addItem}
          />

          <EditItemDialog
            open={isEditItemOpen}
            onOpenChange={setIsEditItemOpen}
            onUpdateItem={handleUpdateItem}
            item={selectedItem}
          />
        </>
      )}
    </>
  );
};
