
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignatureCanvas from 'react-signature-canvas';
import { Quote, ClientInfo } from "@/pages/Index";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  clientInfo?: ClientInfo;
  onSignatureComplete: (signatureData: SignatureData) => void;
}

export interface SignatureData {
  signatureImageData: string;
  signerName: string;
  signerTitle: string;
  signedDate: string;
}

export const SignatureDialog = ({ 
  open, 
  onOpenChange, 
  quote, 
  clientInfo, 
  onSignatureComplete 
}: SignatureDialogProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signerName, setSignerName] = useState(clientInfo?.contact_name || "");
  const [signerTitle, setSignerTitle] = useState("");

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleAccept = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide a signature before accepting the agreement.");
      return;
    }

    if (!signerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    const signatureData: SignatureData = {
      signatureImageData: sigCanvas.current?.toDataURL() || "",
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim(),
      signedDate: new Date().toLocaleDateString()
    };

    onSignatureComplete(signatureData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Electronic Signature Required</DialogTitle>
          <DialogDescription>
            Please review and sign the agreement for {clientInfo?.company_name || "this quote"}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quote Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Agreement Summary</h4>
            <p className="text-sm text-gray-700">Quote: {quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`}</p>
            <p className="text-sm text-gray-700">Amount: ${quote.amount.toFixed(2)}</p>
            <p className="text-sm text-gray-700">Date: {new Date(quote.date).toLocaleDateString()}</p>
            {quote.expiresAt && (
              <p className="text-sm text-gray-700">
                Expires: {new Date(quote.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Signer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">Full Name *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerTitle">Title (Optional)</Label>
              <Input
                id="signerTitle"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="e.g., CEO, Manager"
              />
            </div>
          </div>

          {/* Signature Pad */}
          <div className="space-y-2">
            <Label>Electronic Signature *</Label>
            <div className="border border-gray-300 rounded-lg p-2">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  width: 550,
                  height: 200,
                  className: 'signature-canvas border rounded'
                }}
                backgroundColor="white"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Please sign above</p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={clearSignature}
              >
                Clear Signature
              </Button>
            </div>
          </div>

          {/* Agreement Text */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              By signing this agreement, I acknowledge that I have read, understood, and agree to be bound by the terms and conditions outlined in this quote. This electronic signature has the same legal effect as a handwritten signature.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept Agreement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
