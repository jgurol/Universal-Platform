
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { Vendor } from "@/types/vendors";

interface UploadPriceSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, name: string, vendorId?: string) => Promise<void>;
  vendors: Vendor[];
}

export const UploadPriceSheetDialog = ({ open, onOpenChange, onUpload, vendors }: UploadPriceSheetDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [vendorId, setVendorId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        // Auto-set name based on filename
        const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
        setName(fileName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;

    try {
      setIsUploading(true);
      await onUpload(file, name, vendorId || undefined);
      
      // Reset form
      setFile(null);
      setName("");
      setVendorId("");
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Price Sheet</DialogTitle>
          <DialogDescription>
            Upload a vendor price sheet and give it a name for easy reference.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Price Sheet Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AT&T Fiber Q1 2024 Pricing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Associated Vendor (Optional)</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: vendor.color || '#3B82F6' }}
                      />
                      {vendor.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.xlsx,.xls,.doc,.docx,.csv"
                className="hidden"
                required
              />
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : "Click to upload a file"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PDF, Excel, Word, or CSV files
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!file || !name || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Price Sheet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
