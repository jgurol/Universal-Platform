
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, PhoneCall } from 'lucide-react';
import { CreateLNPRequestData } from '@/hooks/useLNPPortingRequests';
import { useClientInfos } from '@/hooks/useClientInfos';

interface CreateLNPRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRequest: (requestData: CreateLNPRequestData, numbers: string[]) => Promise<void>;
}

export const CreateLNPRequestDialog = ({ open, onOpenChange, onCreateRequest }: CreateLNPRequestDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numbers, setNumbers] = useState<string[]>(['']);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState<CreateLNPRequestData>({
    current_carrier: '',
    authorized_contact_name: '',
    business_name: '',
    service_address: ''
  });

  const { clientInfos, fetchClientInfos } = useClientInfos();

  useEffect(() => {
    if (open) {
      fetchClientInfos();
    }
  }, [open, fetchClientInfos]);

  // Update business name when client is selected
  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clientInfos.find(client => client.id === selectedClientId);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          business_name: selectedClient.company_name,
          client_info_id: selectedClientId
        }));
      }
    }
  }, [selectedClientId, clientInfos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validNumbers = numbers.filter(num => num.trim() !== '');
    if (validNumbers.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateRequest(formData, validNumbers);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      current_carrier: '',
      authorized_contact_name: '',
      business_name: '',
      service_address: ''
    });
    setNumbers(['']);
    setSelectedClientId('');
    onOpenChange(false);
  };

  const addNumber = () => {
    setNumbers([...numbers, '']);
  };

  const removeNumber = (index: number) => {
    setNumbers(numbers.filter((_, i) => i !== index));
  };

  const updateNumber = (index: number, value: string) => {
    const newNumbers = [...numbers];
    newNumbers[index] = value;
    setNumbers(newNumbers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5" />
            Create New Port Request
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Selection</h3>
            <div className="space-y-2">
              <Label htmlFor="client_selection">Select Client *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {clientInfos.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientInfos.length === 0 && (
                <p className="text-sm text-red-500">No clients available. Please add a client first.</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  required
                  disabled={!!selectedClientId}
                  placeholder={selectedClientId ? "Auto-filled from selected client" : "Enter business name"}
                />
              </div>
              <div>
                <Label htmlFor="current_carrier">Current Carrier *</Label>
                <Input
                  id="current_carrier"
                  value={formData.current_carrier}
                  onChange={(e) => setFormData({...formData, current_carrier: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number || ''}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="billing_phone_number">Billing Phone Number</Label>
                <Input
                  id="billing_phone_number"
                  value={formData.billing_phone_number || ''}
                  onChange={(e) => setFormData({...formData, billing_phone_number: e.target.value})}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Authorized Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorized_contact_name">Contact Name *</Label>
                <Input
                  id="authorized_contact_name"
                  value={formData.authorized_contact_name}
                  onChange={(e) => setFormData({...formData, authorized_contact_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="authorized_contact_title">Contact Title</Label>
                <Input
                  id="authorized_contact_title"
                  value={formData.authorized_contact_title || ''}
                  onChange={(e) => setFormData({...formData, authorized_contact_title: e.target.value})}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service_address">Service Address *</Label>
                <Textarea
                  id="service_address"
                  value={formData.service_address}
                  onChange={(e) => setFormData({...formData, service_address: e.target.value})}
                  required
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="billing_address">Billing Address (if different)</Label>
                <Textarea
                  id="billing_address"
                  value={formData.billing_address || ''}
                  onChange={(e) => setFormData({...formData, billing_address: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Phone Numbers */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Phone Numbers to Port</h3>
              <Button type="button" onClick={addNumber} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Number
              </Button>
            </div>
            <div className="space-y-2">
              {numbers.map((number, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={number}
                    onChange={(e) => updateNumber(index, e.target.value)}
                    placeholder="Enter phone number"
                    className="flex-1"
                  />
                  {numbers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeNumber(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Any additional notes or special instructions..."
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
              disabled={isSubmitting || !selectedClientId}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Port Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
