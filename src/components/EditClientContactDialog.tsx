
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientContact, UpdateClientContactData } from "@/types/clientContacts";

interface EditClientContactDialogProps {
  contact: ClientContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateContact: (contactData: UpdateClientContactData) => Promise<void>;
}

export const EditClientContactDialog = ({ 
  contact,
  open, 
  onOpenChange, 
  onUpdateContact 
}: EditClientContactDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setEmail(contact.email || "");
      setRole(contact.role || "");
      setIsPrimary(contact.is_primary);
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdateContact({
        id: contact.id,
        name: name.trim(),
        email: email.trim() || null,
        role: role.trim() || null,
        is_primary: isPrimary
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update the contact information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter contact name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role/Title</Label>
            <Input
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Manager, CEO, IT Director"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label htmlFor="edit-isPrimary">Primary Contact</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Updating...' : 'Update Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
