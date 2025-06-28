
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { QuoteItemData } from "@/types/quoteItems";
import { AdvancedTiptapEditor } from "@/components/AdvancedTiptapEditor";
import { secureTextSchema } from "@/utils/securityUtils";

interface ItemNameAndDescriptionProps {
  quoteItem: QuoteItemData;
  onUpdateItem: (itemId: string, field: keyof QuoteItemData, value: number | string) => void;
}

export const ItemNameAndDescription = ({ quoteItem, onUpdateItem }: ItemNameAndDescriptionProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState(quoteItem.description || quoteItem.item?.description || '');

  const currentDescription = quoteItem.description || quoteItem.item?.description || '';

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setTempDescription(quoteItem.description || quoteItem.item?.description || '');
    }
    setIsDescriptionOpen(open);
  };

  const handleDescriptionSave = () => {
    try {
      secureTextSchema.parse(tempDescription);
    } catch (error) {
      console.error('Description contains potentially unsafe content');
      return;
    }
    
    console.log('[QuoteItemRow] Saving description:', tempDescription);
    onUpdateItem(quoteItem.id, 'description', tempDescription);
    setIsDescriptionOpen(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(quoteItem.description || quoteItem.item?.description || '');
    setIsDescriptionOpen(false);
  };

  return (
    <div className="space-y-2">
      <Input
        value={quoteItem.name || quoteItem.item?.name || ''}
        onChange={(e) => onUpdateItem(quoteItem.id, 'name', e.target.value)}
        placeholder="Item name"
        className="text-sm font-medium h-8"
      />
      <div className="space-y-1">
        <Dialog open={isDescriptionOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 justify-start text-xs text-gray-600"
            >
              <FileText className="w-3 h-3 mr-1" />
              {currentDescription ? 'Edit description' : 'Add description'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Edit Item Description</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <AdvancedTiptapEditor
                value={tempDescription}
                onChange={setTempDescription}
                placeholder="Enter item description with formatting and images..."
                className="min-h-[200px]"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleDescriptionCancel}>
                  Cancel
                </Button>
                <Button onClick={handleDescriptionSave} className="bg-blue-600 hover:bg-blue-700">
                  Save Description
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
