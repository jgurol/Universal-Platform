
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle } from 'lucide-react';

interface FOCDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (focDate: string) => void;
  requestId: string;
  businessName: string;
}

export const FOCDateDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  requestId,
  businessName 
}: FOCDateDialogProps) => {
  const [focDate, setFocDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!focDate) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(focDate);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFocDate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Set FOC Date
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              You are approving the LNP port request for <strong>{businessName}</strong>.
              Please set the Firm Order Commitment (FOC) date.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="foc_date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              FOC Date *
            </Label>
            <Input
              id="foc_date"
              type="date"
              value={focDate}
              onChange={(e) => setFocDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-600">
              The date when the port will be completed
            </p>
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
              disabled={isSubmitting || !focDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Approving...' : 'Approve with FOC Date'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
