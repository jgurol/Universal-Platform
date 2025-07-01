
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, PhoneCall } from 'lucide-react';
import { useClientInfos } from '@/hooks/useClientInfos';
import { useAuth } from '@/context/AuthContext';

interface CreateLNPRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRequest: (requestData: any, numbers: string[]) => Promise<void>;
}

export const CreateLNPRequestDialog = ({ open, onOpenChange, onCreateRequest }: CreateLNPRequestDialogProps) => {
  const { user } = useAuth();
  const { clientInfos } = useClientInfos();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numbers, setNumbers] = useState<string[]>(['']);
  
  const [formData, setFormData] = useState({
    client_info_id: '',
    business_name: '',
    current_carrier: '',
    account_number: '',
    billing_phone_number: '',
    authorized_contact_name: '',
    authorized_contact_title: '',
    service_address: '',
    billing_address: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.current_carrier || !formData.authorized_contact_name) return;

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
      client_info_id: '',
      business_name: '',
      current_carrier: '',
      account_number: '',
      billing_phone_number: '',
      authorized_contact_name: '',
      authorized_contact_title: '',
      service_address: '',
      billing_address: '',
      notes: ''
    });
    setNumbers(['']);
    onOpenChange(false);
  };

  const addNumber = () => {
    setNumbers([...numbers, '']);
  };

  const removeNumber = (index: number) => {
    if (numbers.length > 1) {
      setNumbers(numbers.filter((_, i) => i !== index));
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Select value={formData.client_info_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_info_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clientInfos.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter business name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_carrier">Current Carrier *</Label>
              <Input
                id="current_carrier"
                value={formData.current_carrier}
                onChange={(e) => setFormData(prev => ({ ...prev, current_carrier: e.target.value }))}
                placeholder="e.g., AT&T, Verizon, T-Mobile"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="Current carrier account number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_phone_number">Billing Phone Number</Label>
              <Input
                id="billing_phone_number"
                value={formData.billing_phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_phone_number: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorized_contact_name">Authorized Contact Name *</Label>
              <Input
                id="authorized_contact_name"
                value={formData.authorized_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, authorized_contact_name: e.target.value }))}
                placeholder="Full name of authorized contact"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorized_contact_title">Contact Title</Label>
              <Input
                id="authorized_contact_title"
                value={formData.authorized_contact_title}
                onChange={(e) => setFormData(prev => ({ ...prev, authorized_contact_title: e.target.value }))}
                placeholder="e.g., Owner, Manager, IT Director"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_address">Service Address *</Label>
            <Textarea
              id="service_address"
              value={formData.service_address}
              onChange={(e) => setFormData(prev => ({ ...prev, service_address: e.target.value }))}
              placeholder="Complete service address"
              required
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea
              id="billing_address"
              value={formData.billing_address}
              onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
              placeholder="Billing address (if different from service address)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Numbers to Port *</Label>
            <div className="space-y-2">
              {numbers.map((number, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={number}
                    onChange={(e) => updateNumber(index, e.target.value)}
                    placeholder="(555) 123-4567"
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNumber}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Number
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or special instructions"
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
              disabled={isSubmitting || !formData.business_name || !formData.current_carrier || !formData.authorized_contact_name}
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
