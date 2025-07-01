
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PhoneCall, Building, User, MapPin, Phone, FileText, Calendar, Undo, Trash2 } from 'lucide-react';
import { LNPPortingRequest } from '@/hooks/useLNPPortingRequests';
import { LOAFormDialog } from '@/components/LOAFormDialog';
import { FOCDateDialog } from '@/components/FOCDateDialog';
import { MarkCompletedDialog } from '@/components/MarkCompletedDialog';

interface LNPRequestDetailsDialogProps {
  request: LNPPortingRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRequest: (requestId: string, updates: Partial<LNPPortingRequest>) => Promise<void>;
  onDeleteRequest?: (requestId: string) => Promise<void>;
  onMarkCompleted?: (requestId: string, completedDate: string) => Promise<void>;
}

export const LNPRequestDetailsDialog = ({ 
  request, 
  open, 
  onOpenChange, 
  onUpdateRequest,
  onDeleteRequest,
  onMarkCompleted 
}: LNPRequestDetailsDialogProps) => {
  const [isLOAFormOpen, setIsLOAFormOpen] = useState(false);
  const [isFOCDialogOpen, setIsFOCDialogOpen] = useState(false);
  const [isMarkCompletedOpen, setIsMarkCompletedOpen] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproveWithFOC = async (focDate: string) => {
    await onUpdateRequest(request.id, { 
      status: 'approved',
      foc_date: focDate
    });
    // Close the main dialog to return to the LNP page
    onOpenChange(false);
  };

  const handleMarkCompleted = async (completedDate: string) => {
    if (onMarkCompleted) {
      await onMarkCompleted(request.id, completedDate);
    }
  };

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      let newStatus: string;
      let updates: Partial<LNPPortingRequest> = {};

      if (request.status === 'completed') {
        newStatus = 'submitted';
        updates = {
          status: 'submitted',
          completed_at: undefined
        };
      } else if (request.status === 'submitted') {
        newStatus = 'pending';
        updates = {
          status: 'pending',
          submitted_at: undefined,
          signature_data: undefined
        };
      } else {
        // Can't undo from pending
        return;
      }

      await onUpdateRequest(request.id, updates);
      // Close the main dialog to return to the LNP page
      onOpenChange(false);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteRequest) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this LNP request for ${request.business_name}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await onDeleteRequest(request.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLOAComplete = async (signatureData: string) => {
    await onUpdateRequest(request.id, {
      signature_data: signatureData,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    });
    setIsLOAFormOpen(false);
    // Close the main dialog as well to return to the LNP page
    onOpenChange(false);
  };

  const canUndo = request.status === 'completed' || request.status === 'submitted';
  const getUndoToStatus = () => {
    if (request.status === 'completed') return 'submitted';
    if (request.status === 'submitted') return 'pending';
    return '';
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
                {canUndo && (
                  <Button
                    onClick={handleUndo}
                    disabled={isUndoing}
                    variant="outline"
                    size="sm"
                  >
                    <Undo className="w-4 h-4 mr-2" />
                    {isUndoing ? 'Undoing...' : `Undo to ${getUndoToStatus()}`}
                  </Button>
                )}
                {onDeleteRequest && (
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
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
                    onClick={() => setIsFOCDialogOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Approve with FOC Date
                  </Button>
                )}
                {request.status === 'approved' && (
                  <Button
                    onClick={() => setIsMarkCompletedOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    Mark as Completed
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

            {/* Timeline */}
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
                {request.foc_date && (
                  <div>
                    <span className="font-medium text-gray-600">FOC Date:</span>
                    <p className="text-green-600 font-medium">
                      {new Date(request.foc_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {request.completed_at && (
                  <div>
                    <span className="font-medium text-gray-600">Completed:</span>
                    <p className="text-blue-600 font-medium">
                      {new Date(request.completed_at).toLocaleDateString()}
                    </p>
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
        onComplete={handleLOAComplete}
      />

      <FOCDateDialog
        open={isFOCDialogOpen}
        onOpenChange={setIsFOCDialogOpen}
        onConfirm={handleApproveWithFOC}
        requestId={request.id}
        businessName={request.business_name}
      />

      <MarkCompletedDialog
        open={isMarkCompletedOpen}
        onOpenChange={setIsMarkCompletedOpen}
        onConfirm={handleMarkCompleted}
        requestId={request.id}
        businessName={request.business_name}
        focDate={request.foc_date}
      />
    </>
  );
};
