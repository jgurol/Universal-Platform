
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone } from 'lucide-react';

interface AddDIDDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDID: (didNumber: string, notes?: string) => Promise<void>;
}

export const AddDIDDialog = ({ open, onOpenChange, onAddDID }: AddDIDDialogProps) => {
  const [didNumber, setDIDNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate DID number (must be exactly 10 digits)
    const cleanDID = didNumber.replace(/\D/g, '');
    if (cleanDID.length !== 10) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddDID(cleanDID, notes.trim() || undefined);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDIDNumber('');
    setNotes('');
    onOpenChange(false);
  };

  const handleDIDNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setDIDNumber(value);
    }
  };

  const formatDIDDisplay = (value: string) => {
    if (value.length >= 6) {
      return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length >= 3) {
      return `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Add DID Number
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="did-number">DID Number *</Label>
            <Input
              id="did-number"
              type="text"
              placeholder="Enter 10-digit DID number"
              value={formatDIDDisplay(didNumber)}
              onChange={handleDIDNumberChange}
              className="font-mono"
              required
            />
            <p className="text-xs text-gray-500">
              Enter exactly 10 digits (e.g., 5551234567)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this DID number..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || didNumber.length !== 10}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Adding...' : 'Add DID Number'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
