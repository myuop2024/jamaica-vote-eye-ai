import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, FileText, User, CreditCard, Home, Phone, Mail, RefreshCw } from 'lucide-react';
import { VerificationMethod, DocumentType } from '@/types/didit';

interface DiditConfig {
  enabled_verification_methods: string[];
  document_types_allowed: string[];
}

export const DiditVerificationForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('document');
  const [documentType, setDocumentType] = useState<DocumentType>('passport');
  const [config, setConfig] = useState<DiditConfig>({
    enabled_verification_methods: ['document'],
    document_types_allowed: ['passport', 'drivers_license', 'national_id', 'voters_id']
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value')
        .in('setting_key', ['enabled_verification_methods', 'document_types_allowed'])
        .eq('is_active', true);

      if (error) {
        console.error('Error loading configuration:', error);
        return;
      }

      if (data && data.length > 0) {
        const configMap = data.reduce((acc, item) => {
          let value = item.setting_value;
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              // If parsing fails, use the original value
            }
          } else if (typeof value === 'object' && value !== null && 'value' in value) {
            value = (value as any).value;
          }
          acc[item.setting_key] = value;
          return acc;
        }, {} as Record<string, any>);

        const updatedConfig = {
          enabled_verification_methods: Array.isArray(configMap.enabled_verification_methods) 
            ? configMap.enabled_verification_methods 
            : ['document'],
          document_types_allowed: Array.isArray(configMap.document_types_allowed) 
            ? configMap.document_types_allowed 
            : ['passport', 'drivers_license', 'national_id', 'voters_id']
        };

        setConfig(updatedConfig);
        
        // Set default verification method to the first available one
        if (updatedConfig.enabled_verification_methods.length > 0) {
          setVerificationMethod(updatedConfig.enabled_verification_methods[0] as VerificationMethod);
        }
        
        // Set default document type to the first available one
        if (updatedConfig.document_types_allowed.length > 0) {
          setDocumentType(updatedConfig.document_types_allowed[0] as DocumentType);
        }
      }
    } catch (error) {
      console.error('Error loading verification configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'document':
        return FileText;
      case 'biometric':
      case 'liveness':
        return User;
      default:
        return Shield;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'document':
        return 'Document Verification';
      case 'biometric':
        return 'Biometric Verification';
      case 'liveness':
        return 'Liveness Detection';
      case 'address':
        return 'Address Verification';
      case 'phone':
        return 'Phone Verification';
      case 'email':
        return 'Email Verification';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  const getDocumentLabel = (docType: string) => {
    switch (docType) {
      case 'passport':
        return 'Passport';
      case 'drivers_license':
        return "Driver's License";
      case 'national_id':
        return 'National ID';
      case 'voters_id':
        return "Voter's ID";
      case 'birth_certificate':
        return 'Birth Certificate';
      case 'utility_bill':
        return 'Utility Bill';
      case 'bank_statement':
        return 'Bank Statement';
      default:
        return docType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

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
          description: "Redirecting to verification portal...",
        });

        // Open verification in the same window to keep user in flow
        if (data.clientUrl) {
          window.location.href = data.clientUrl;
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Loading Verification Options...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  const MethodIcon = getMethodIcon(verificationMethod);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Start Identity Verification
        </CardTitle>
        <CardDescription>
          Complete the identity verification process as required by your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {config.enabled_verification_methods.length > 1 && (
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
                {config.enabled_verification_methods.map((method) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex items-center gap-2">
                      {React.createElement(getMethodIcon(method), { className: "w-4 h-4" })}
                      <span>{getMethodLabel(method)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {verificationMethod === 'document' && config.document_types_allowed.length > 1 && (
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
                {config.document_types_allowed.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getDocumentLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MethodIcon className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">{getMethodLabel(verificationMethod)}</span>
          </div>
          <p className="text-sm text-blue-700">
            {verificationMethod === 'document' && 'You will be asked to take photos of your government-issued document.'}
            {verificationMethod === 'biometric' && 'You will be asked to take a selfie and verify your identity.'}
            {verificationMethod === 'liveness' && 'You will be asked to perform simple actions to verify you are a real person.'}
            {!['document', 'biometric', 'liveness'].includes(verificationMethod) && 'Follow the instructions to complete verification.'}
          </p>
        </div>

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
            <li>Allow secure processing of your identity documents</li>
            <li>Share verification results with this platform</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
