
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

interface MarkCompletedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (completedDate: string) => void;
  requestId: string;
  businessName: string;
  focDate?: string;
}

export const MarkCompletedDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  requestId,
  businessName,
  focDate 
}: MarkCompletedDialogProps) => {
  const [completedDate, setCompletedDate] = useState(
    focDate ? new Date(focDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!completedDate) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(completedDate);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCompletedDate(
      focDate ? new Date(focDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Mark Port as Completed
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              You are marking the LNP port request for <strong>{businessName}</strong> as completed.
              Please confirm the completion date.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completed_date">
              Completion Date *
            </Label>
            <Input
              id="completed_date"
              type="date"
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-600">
              The date when the port was actually completed
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
              disabled={isSubmitting || !completedDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Marking Complete...' : 'Mark as Completed'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
