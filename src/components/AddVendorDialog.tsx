
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vendor } from "@/types/vendors";

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVendor: (vendor: Omit<Vendor, "id" | "user_id" | "created_at" | "updated_at">) => void;
}

const colorOptions = [
  { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
  { value: '#10B981', label: 'Green', class: 'bg-green-500' },
  { value: '#F59E0B', label: 'Yellow', class: 'bg-yellow-500' },
  { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#EC4899', label: 'Pink', class: 'bg-pink-500' },
  { value: '#06B6D4', label: 'Cyan', class: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lime', class: 'bg-lime-500' },
  { value: '#F97316', label: 'Orange', class: 'bg-orange-500' },
  { value: '#6366F1', label: 'Indigo', class: 'bg-indigo-500' },
  { value: '#14B8A6', label: 'Teal', class: 'bg-teal-500' },
  { value: '#F43F5E', label: 'Rose', class: 'bg-rose-500' },
  { value: '#6B7280', label: 'Gray', class: 'bg-gray-500' },
  { value: '#64748B', label: 'Slate', class: 'bg-slate-500' },
  { value: '#78716C', label: 'Stone', class: 'bg-stone-500' },
  { value: '#525252', label: 'Neutral', class: 'bg-neutral-500' }
];

export const AddVendorDialog = ({ open, onOpenChange, onAddVendor }: AddVendorDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repName, setRepName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [salesModel, setSalesModel] = useState<'agent' | 'partner' | 'wholesale'>('agent');
  const [color, setColor] = useState('#3B82F6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onAddVendor({
        name,
        description: description || undefined,
        rep_name: repName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        sales_model: salesModel,
        color,
        is_active: true
      });
      
      // Reset form
      setName("");
      setDescription("");
      setRepName("");
      setEmail("");
      setPhone("");
      setSalesModel('agent');
      setColor('#3B82F6');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor to your system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter vendor description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repName">Rep Name</Label>
              <Input
                id="repName"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="Representative name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesModel">Sales Model</Label>
              <Select value={salesModel} onValueChange={(value: 'agent' | 'partner' | 'wholesale') => setSalesModel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales model" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="grid grid-cols-8 gap-2 p-3 border border-gray-200 rounded-lg">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === colorOption.value 
                      ? 'border-gray-900 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                  } ${colorOption.class}`}
                  onClick={() => setColor(colorOption.value)}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!name}
            >
              Add Vendor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
