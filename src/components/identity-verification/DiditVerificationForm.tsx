
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, FileText, User, CreditCard, Home, Phone, Mail, RefreshCw } from 'lucide-react';
import { VerificationMethod, DocumentType } from '@/types/didit';

export const DiditVerificationForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('document');
  const [documentType, setDocumentType] = useState<DocumentType>('passport');

  const verificationMethods = [
    { value: 'document', label: 'Document Verification', icon: FileText, description: 'Verify using government-issued documents' },
    { value: 'biometric', label: 'Biometric Verification', icon: User, description: 'Facial recognition and liveness detection' },
    { value: 'liveness', label: 'Liveness Detection', icon: User, description: 'Verify you are a real person' },
    { value: 'address', label: 'Address Verification', icon: Home, description: 'Verify your residential address' },
    { value: 'phone', label: 'Phone Verification', icon: Phone, description: 'Verify your phone number' },
    { value: 'email', label: 'Email Verification', icon: Mail, description: 'Verify your email address' }
  ];

  const documentTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: 'Driver\'s License' },
    { value: 'national_id', label: 'National ID' },
    { value: 'voters_id', label: 'Voter\'s ID' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'utility_bill', label: 'Utility Bill' },
    { value: 'bank_statement', label: 'Bank Statement' }
  ];

  const startVerification = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start verification",
        variant: "destructive"
      });
      return;
    }

    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('didit-verification', {
        body: {
          action: 'start_verification',
          user_id: user.id,
          verification_method: verificationMethod,
          document_type: verificationMethod === 'document' ? documentType : undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Verification Started",
          description: "Redirecting to Didit verification portal...",
        });

        // Open Didit verification in a new window
        if (data.clientUrl) {
          window.open(data.clientUrl, '_blank', 'width=800,height=600');
        }
      } else {
        throw new Error(data?.error || 'Failed to start verification');
      }
    } catch (error) {
      console.error('Verification start error:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : 'Failed to start verification',
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const selectedMethod = verificationMethods.find(m => m.value === verificationMethod);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Start Identity Verification
        </CardTitle>
        <CardDescription>
          Choose your verification method and complete the identity verification process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="verification-method">Verification Method</Label>
          <Select
            value={verificationMethod}
            onValueChange={(value: VerificationMethod) => setVerificationMethod(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {verificationMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  <div className="flex items-center gap-2">
                    <method.icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{method.label}</div>
                      <div className="text-xs text-gray-500">{method.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {verificationMethod === 'document' && (
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(value: DocumentType) => setDocumentType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedMethod && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <selectedMethod.icon className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">{selectedMethod.label}</span>
            </div>
            <p className="text-sm text-blue-700">{selectedMethod.description}</p>
          </div>
        )}

        <Button
          onClick={startVerification}
          disabled={isStarting}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isStarting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Starting Verification...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Start Verification
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500">
          <p>By starting verification, you agree to:</p>
          <ul className="list-disc list-inside ml-2 mt-1">
            <li>Provide accurate information</li>
            <li>Allow Didit to process your identity documents</li>
            <li>Share verification results with our platform</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
