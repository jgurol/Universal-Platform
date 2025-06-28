
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

interface AcceptanceFormProps {
  clientName: string;
  setClientName: (value: string) => void;
  clientEmail: string;
  setClientEmail: (value: string) => void;
  signatureData: string;
  setSignatureData: (value: string) => void;
  isSubmitting: boolean;
  onAccept: () => void;
}

export const AcceptanceForm = ({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  signatureData,
  setSignatureData,
  isSubmitting,
  onAccept
}: AcceptanceFormProps) => {
  const signaturePadRef = useRef<SignatureCanvas | null>(null);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignatureData('');
    }
  };

  const saveSignature = () => {
    if (signaturePadRef.current) {
      const dataURL = signaturePadRef.current.toDataURL();
      setSignatureData(dataURL);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Quote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName">Full Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="clientEmail">Email Address *</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>
        </div>

        {/* Digital Signature */}
        <div>
          <Label>Digital Signature *</Label>
          <div className="mt-2 border-2 border-gray-300 rounded-lg">
            <SignatureCanvas
              ref={signaturePadRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas w-full'
              }}
              onEnd={() => saveSignature()}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSignature}
            >
              Clear Signature
            </Button>
            <p className="text-xs text-gray-500">Please sign above to accept this quote</p>
          </div>
        </div>

        <Button
          onClick={onAccept}
          disabled={isSubmitting || !clientName.trim() || !clientEmail.trim() || !signatureData}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Quote
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
