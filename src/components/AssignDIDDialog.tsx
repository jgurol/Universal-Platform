import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Building } from 'lucide-react';
import { useClientInfos } from '@/hooks/useClientInfos';
import { useAuth } from '@/context/AuthContext';

interface AssignDIDDialogProps {
  did: {
    id: string;
    did_number: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignDID: (didId: string, clientInfoId: string) => Promise<void>;
}

export const AssignDIDDialog = ({ did, open, onOpenChange, onAssignDID }: AssignDIDDialogProps) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAdmin, userProfile } = useAuth();
  const { clientInfos, isLoading, fetchClientInfos } = useClientInfos();

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      console.log('[AssignDIDDialog] Fetching clients for user:', user.id);
      // Call fetchClientInfos with proper parameters based on user role
      if (isAdmin) {
        fetchClientInfos(user.id, undefined, true);
      } else if (userProfile?.associated_agent_id) {
        fetchClientInfos(user.id, userProfile.associated_agent_id, false);
      } else {
        fetchClientInfos(user.id, undefined, false);
      }
    }
  }, [open, user?.id, isAdmin, userProfile?.associated_agent_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) return;

    setIsSubmitting(true);
    try {
      await onAssignDID(did.id, selectedClientId);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedClientId('');
    onOpenChange(false);
  };

  const formatDIDNumber = (didNumber: string) => {
    return `(${didNumber.slice(0, 3)}) ${didNumber.slice(3, 6)}-${didNumber.slice(6)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Assign DID Number
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <span className="font-mono text-lg font-medium">
                {formatDIDNumber(did.did_number)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Select Client *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                  ) : clientInfos.length === 0 ? (
                    <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                  ) : (
                    clientInfos.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {client.company_name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!isLoading && clientInfos.length > 0 && (
                <p className="text-xs text-gray-500">
                  Found {clientInfos.length} client(s)
                </p>
              )}
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
                disabled={isSubmitting || !selectedClientId || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Assigning...' : 'Assign DID'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
