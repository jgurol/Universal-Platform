import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface AgentData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string | null;
  commission_rate: number;
}

interface TokenData {
  id: string;
  agent_id: string;
  expires_at: string;
  used: boolean;
}

export default function AgentAgreement() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    businessAddress: '',
    phoneNumber: '',
    taxId: '',
    businessType: 'individual', // individual, llc, corporation
    agreesToTerms: false,
  });
  
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const [w9File, setW9File] = useState<File | null>(null);

  useEffect(() => {
    if (token) {
      validateTokenAndLoadAgent();
    }
  }, [token]);

  const validateTokenAndLoadAgent = async () => {
    try {
      // Validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('agent_agreement_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        setIsValidToken(false);
        return;
      }

      // Check if token is expired or used
      if (tokenData.used || new Date(tokenData.expires_at) < new Date()) {
        setIsValidToken(false);
        return;
      }

      setTokenData(tokenData);

      // Load agent data
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', tokenData.agent_id)
        .single();

      if (agentError || !agent) {
        setIsValidToken(false);
        return;
      }

      setAgentData(agent);
      setFormData(prev => ({
        ...prev,
        fullName: `${agent.first_name} ${agent.last_name}`,
      }));
      setIsValidToken(true);

    } catch (error) {
      console.error('Error validating token:', error);
      setIsValidToken(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, JPEG, or PNG file.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setW9File(file);
  };

  const uploadW9File = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${agentData!.id}/w9-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('agent-documents')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error('Failed to upload W9 file');
    }

    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentData || !tokenData || !signatureRef) return;

    // Validate required fields
    if (!formData.agreesToTerms) {
      toast({
        title: 'Agreement required',
        description: 'You must agree to the terms and conditions.',
        variant: 'destructive'
      });
      return;
    }

    if (!w9File) {
      toast({
        title: 'W9 form required',
        description: 'Please upload your signed W9 form.',
        variant: 'destructive'
      });
      return;
    }

    if (signatureRef.isEmpty()) {
      toast({
        title: 'Signature required',
        description: 'Please provide your digital signature.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload W9 file
      const w9FilePath = await uploadW9File(w9File);

      // Get signature data
      const signatureData = signatureRef.toDataURL();

      // Get client IP and user agent
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      // Submit agreement
      const { error } = await supabase
        .from('agent_agreements')
        .insert({
          agent_id: agentData.id,
          agreement_data: formData,
          digital_signature: signatureData,
          ip_address: ip,
          user_agent: navigator.userAgent,
          w9_file_path: w9FilePath,
          w9_file_name: w9File.name,
          w9_file_size: w9File.size,
        });

      if (error) {
        throw new Error('Failed to submit agreement');
      }

      // Mark token as used
      await supabase
        .from('agent_agreement_tokens')
        .update({ used: true })
        .eq('id', tokenData.id);

      setIsSubmitted(true);
      toast({
        title: 'Agreement submitted!',
        description: 'Your agent agreement has been submitted successfully.',
      });

    } catch (error) {
      console.error('Error submitting agreement:', error);
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your agreement. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid or Expired Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This agent agreement link is invalid or has expired. Please contact us for a new link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">Agreement Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Thank you for completing your agent agreement. We will review your submission and contact you soon.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Agent Agreement Form</CardTitle>
            <p className="text-sm text-gray-600">
              Welcome {agentData?.first_name}! Your commission rate is {agentData?.commission_rate}%
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Agent Agreement Terms */}
              <div className="prose max-w-none">
                <h3>Agent Agreement Terms</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <p><strong>INDEPENDENT SALES AGENT AGREEMENT</strong></p>
                  <p>This Agreement is entered into between the Company and the Agent named below.</p>
                  
                  <p><strong>1. APPOINTMENT:</strong> Company hereby appoints Agent as an independent sales representative to solicit orders for Company's products and services.</p>
                  
                  <p><strong>2. COMMISSION:</strong> Agent shall receive a commission of {agentData?.commission_rate}% on all accepted orders procured by Agent.</p>
                  
                  <p><strong>3. TERRITORY:</strong> Agent's territory shall be as mutually agreed upon in writing.</p>
                  
                  <p><strong>4. INDEPENDENT CONTRACTOR:</strong> Agent is an independent contractor and not an employee of Company.</p>
                  
                  <p><strong>5. CONFIDENTIALITY:</strong> Agent agrees to maintain confidentiality of all Company information.</p>
                  
                  <p><strong>6. TERMINATION:</strong> Either party may terminate this agreement with 30 days written notice.</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Legal Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">Business Address</Label>
                <Textarea
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxId">Tax ID / SSN</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="individual">Individual</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                  </select>
                </div>
              </div>

              {/* W9 Upload */}
              <div>
                <Label>W9 Form Upload</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="w9-upload"
                  />
                  <label
                    htmlFor="w9-upload"
                    className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {w9File ? w9File.name : 'Click to upload W9 form (PDF, JPG, PNG)'}
                      </p>
                    </div>
                  </label>
                  {w9File && (
                    <div className="mt-2 flex items-center text-green-600">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm">{w9File.name} ({(w9File.size / 1024 / 1024).toFixed(2)}MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Signature */}
              <div>
                <Label>Digital Signature</Label>
                <div className="mt-2">
                  <div className="border-2 border-gray-300 rounded-lg">
                    <SignatureCanvas
                      ref={(ref) => setSignatureRef(ref)}
                      canvasProps={{
                        width: '100%',
                        height: 200,
                        className: 'signature-canvas w-full'
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => signatureRef?.clear()}
                    >
                      Clear Signature
                    </Button>
                    <p className="text-xs text-gray-500">Please sign above</p>
                  </div>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreesToTerms"
                  checked={formData.agreesToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreesToTerms: checked as boolean }))
                  }
                />
                <Label htmlFor="agreesToTerms" className="text-sm">
                  I agree to the terms and conditions of this Agent Agreement and certify that the information provided is accurate.
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Agent Agreement'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
