
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Phone } from 'lucide-react';

interface DeleteDIDDialogProps {
  did: {
    id: string;
    did_number: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteDIDDialog = ({ did, open, onOpenChange, onConfirm }: DeleteDIDDialogProps) => {
  const formatDIDNumber = (didNumber: string) => {
    return `(${didNumber.slice(0, 3)}) ${didNumber.slice(3, 6)}-${didNumber.slice(6)}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Delete DID Number
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the DID number{' '}
            <span className="font-mono font-medium">
              {did ? formatDIDNumber(did.did_number) : ''}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
