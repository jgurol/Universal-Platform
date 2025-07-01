
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PhoneCall, Building, User, MapPin, Phone, FileText, Calendar } from 'lucide-react';
import { LNPPortingRequest } from '@/hooks/useLNPPortingRequests';
import { LOAFormDialog } from '@/components/LOAFormDialog';

interface LNPRequestDetailsDialogProps {
  request: LNPPortingRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRequest: (requestId: string, updates: Partial<LNPPortingRequest>) => Promise<void>;
}

export const LNPRequestDetailsDialog = ({ 
  request, 
  open, 
  onOpenChange, 
  onUpdateRequest 
}: LNPRequestDetailsDialogProps) => {
  const [isLOAFormOpen, setIsLOAFormOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (newStatus: LNPPortingRequest['status']) => {
    onUpdateRequest(request.id, { status: newStatus });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5" />
              Port Request Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
              <div className="flex gap-2">
                {request.status === 'pending' && (
                  <Button
                    onClick={() => setIsLOAFormOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Complete LOA Form
                  </Button>
                )}
                {request.status === 'submitted' && (
                  <Button
                    onClick={() => handleStatusUpdate('approved')}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Approve Request
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Business Name:</span>
                  <p>{request.business_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Current Carrier:</span>
                  <p>{request.current_carrier}</p>
                </div>
                {request.account_number && (
                  <div>
                    <span className="font-medium text-gray-600">Account Number:</span>
                    <p>{request.account_number}</p>
                  </div>
                )}
                {request.billing_phone_number && (
                  <div>
                    <span className="font-medium text-gray-600">Billing Phone:</span>
                    <p>{request.billing_phone_number}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Authorized Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Contact Name:</span>
                  <p>{request.authorized_contact_name}</p>
                </div>
                {request.authorized_contact_title && (
                  <div>
                    <span className="font-medium text-gray-600">Title:</span>
                    <p>{request.authorized_contact_title}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Service Address:</span>
                  <p className="whitespace-pre-wrap">{request.service_address}</p>
                </div>
                {request.billing_address && (
                  <div>
                    <span className="font-medium text-gray-600">Billing Address:</span>
                    <p className="whitespace-pre-wrap">{request.billing_address}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Numbers to Port */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Numbers to Port ({request.numbers?.length || 0})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {request.numbers?.map((number) => (
                  <div key={number.id} className="p-2 border rounded text-sm">
                    <span className="font-mono">{number.phone_number}</span>
                    {number.current_service_type && (
                      <p className="text-gray-600 text-xs">{number.current_service_type}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Created:</span>
                  <p>{new Date(request.created_at).toLocaleString()}</p>
                </div>
                {request.submitted_at && (
                  <div>
                    <span className="font-medium text-gray-600">Submitted:</span>
                    <p>{new Date(request.submitted_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {request.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{request.notes}</p>
                </div>
              </>
            )}

            {/* LOA Status */}
            {request.signature_data && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600">LOA Completed</h3>
                  <p className="text-sm text-gray-600">
                    Letter of Authorization has been digitally signed and submitted.
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <LOAFormDialog
        request={request}
        open={isLOAFormOpen}
        onOpenChange={setIsLOAFormOpen}
        onComplete={(signatureData) => {
          onUpdateRequest(request.id, {
            signature_data: signatureData,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          });
          setIsLOAFormOpen(false);
        }}
      />
    </>
  );
};
