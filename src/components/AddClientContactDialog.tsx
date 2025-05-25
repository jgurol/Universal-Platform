
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AddClientContactData } from "@/types/clientContacts";

interface AddClientContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddContact: (contactData: AddClientContactData) => Promise<void>;
}

export const AddClientContactDialog = ({ 
  open, 
  onOpenChange, 
  onAddContact 
}: AddClientContactDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddContact({
        name: name.trim(),
        email: email.trim() || null,
        role: role.trim() || null,
        is_primary: isPrimary
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("");
    setIsPrimary(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Add a new contact for this client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter contact name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role/Title</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Manager, CEO, IT Director"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label htmlFor="isPrimary">Primary Contact</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onOpenChange(false);
            }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
