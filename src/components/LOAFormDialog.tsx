
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Pen } from 'lucide-react';
import { LNPPortingRequest } from '@/hooks/useLNPPortingRequests';
import SignatureCanvas from 'react-signature-canvas';

interface LOAFormDialogProps {
  request: LNPPortingRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (signatureData: string) => void;
}

export const LOAFormDialog = ({ request, open, onOpenChange, onComplete }: LOAFormDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneFile, setPhoneFile] = useState<File | null>(null);
  const [signatureData, setSignatureData] = useState<string>('');
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoneFile(file);
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setSignatureData('');
  };

  const handleSignatureEnd = () => {
    if (sigCanvas.current) {
      const dataURL = sigCanvas.current.toDataURL();
      setSignatureData(dataURL);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signatureData) {
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, you would upload the phone bill file to storage here
      // For now, we'll just complete with the signature data
      onComplete(signatureData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPhoneFile(null);
    setSignatureData('');
    clearSignature();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Letter of Authorization (LOA) Form
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Port Request Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Business:</span> {request.business_name}
              </div>
              <div>
                <span className="font-medium">Current Carrier:</span> {request.current_carrier}
              </div>
              <div>
                <span className="font-medium">Contact:</span> {request.authorized_contact_name}
              </div>
              <div>
                <span className="font-medium">Numbers:</span> {request.numbers?.length || 0} number(s)
              </div>
            </div>
          </div>

          <Separator />

          {/* Phone Bill Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload Recent Phone Bill</h3>
            <p className="text-sm text-gray-600">
              Please upload a recent phone bill from your current carrier showing the account information and phone numbers to be ported.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                id="phone-bill-upload"
              />
              <label
                htmlFor="phone-bill-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {phoneFile ? phoneFile.name : "Click to upload phone bill"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PDF, JPG, PNG, DOC files accepted
                </span>
              </label>
            </div>
          </div>

          <Separator />

          {/* LOA Agreement Text */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Letter of Authorization</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3">
              <p>
                <strong>To:</strong> {request.current_carrier}
              </p>
              <p>
                I, {request.authorized_contact_name}, as an authorized representative of {request.business_name}, 
                hereby authorize the transfer of the following telephone number(s) from {request.current_carrier} 
                to the new service provider.
              </p>
              
              <div className="my-4">
                <strong>Numbers to be ported:</strong>
                <ul className="list-disc list-inside mt-2">
                  {request.numbers?.map((number) => (
                    <li key={number.id} className="font-mono">{number.phone_number}</li>
                  ))}
                </ul>
              </div>

              <p>
                <strong>Account Information:</strong>
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Business Name: {request.business_name}</li>
                <li>Service Address: {request.service_address}</li>
                {request.account_number && <li>Account Number: {request.account_number}</li>}
                {request.billing_phone_number && <li>Billing Phone: {request.billing_phone_number}</li>}
              </ul>

              <p className="mt-4">
                I understand that this authorization will remain in effect until the requested transfer is completed 
                or until I provide written notification to cancel this request. I acknowledge that I am authorized 
                to make this request on behalf of the business listed above.
              </p>
            </div>
          </div>

          <Separator />

          {/* Digital Signature */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Pen className="w-5 h-5" />
              Digital Signature
            </h3>
            <p className="text-sm text-gray-600">
              Please sign below to authorize this port request:
            </p>
            
            <div className="border-2 border-gray-300 rounded-lg">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 600,
                  height: 200,
                  className: 'signature-canvas w-full'
                }}
                onEnd={handleSignatureEnd}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
              >
                Clear Signature
              </Button>
              <div className="text-sm text-gray-600">
                Signed by: {request.authorized_contact_name}
              </div>
            </div>
          </div>

          <Separator />

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
              disabled={isSubmitting || !signatureData}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit LOA Form'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
