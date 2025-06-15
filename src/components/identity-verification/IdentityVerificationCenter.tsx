
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, Clock, FileText, Eye, AlertTriangle } from 'lucide-react';
import { DiditVerification, VerificationMethod, DocumentType, VerificationResult } from '@/types/didit';

export const IdentityVerificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<DiditVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingVerification, setIsStartingVerification] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVerifications();
    }
  }, [user]);

  const fetchVerifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('didit_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error: any) {
      console.error('Error fetching verifications:', error);
      toast({
        title: "Error",
        description: "Failed to load verification history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVerification = async (method: VerificationMethod, documentType?: DocumentType) => {
    try {
      setIsStartingVerification(true);
      
      // Call our edge function to initialize didit session
      const { data, error } = await supabase.functions.invoke('didit-verification', {
        body: {
          action: 'start_verification',
          verification_method: method,
          document_type: documentType,
          user_id: user?.id
        }
      });

      if (error) throw error;

      if (data.success) {
        // Redirect to didit verification page
        window.open(data.clientUrl, '_blank');
        
        toast({
          title: "Verification Started",
          description: "Please complete the verification in the new window"
        });

        // Refresh verifications after a short delay
        setTimeout(fetchVerifications, 2000);
      } else {
        throw new Error(data.error || 'Failed to start verification');
      }
    } catch (error: any) {
      console.error('Error starting verification:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to start verification",
        variant: "destructive"
      });
    } finally {
      setIsStartingVerification(false);
    }
  };

  const getStatusIcon = (status: VerificationResult) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'expired':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: VerificationResult) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getCurrentVerificationStatus = () => {
    const latestVerification = verifications[0];
    if (!latestVerification) return null;
    
    if (latestVerification.status === 'verified') {
      return {
        type: 'success',
        message: 'Identity verification completed successfully',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />
      };
    } else if (latestVerification.status === 'pending') {
      return {
        type: 'warning',
        message: 'Identity verification in progress',
        icon: <Clock className="w-5 h-5 text-yellow-600" />
      };
    } else {
      return {
        type: 'error',
        message: 'Identity verification failed or expired',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statusInfo = getCurrentVerificationStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Identity Verification Center
          </CardTitle>
          <CardDescription>
            Verify your identity using didit's secure verification platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {statusInfo && (
            <Alert className={statusInfo.type === 'success' ? 'border-green-200 bg-green-50' : 
                           statusInfo.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                           'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {statusInfo.icon}
                <AlertDescription>{statusInfo.message}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold mb-2">Document Verification</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Verify using government-issued ID documents
                </p>
                <Button
                  onClick={() => startVerification('document', 'national_id')}
                  disabled={isStartingVerification}
                  className="w-full"
                >
                  {isStartingVerification ? 'Starting...' : 'Start Document Verification'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
              <CardContent className="p-6 text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold mb-2">Liveness Check</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Verify using facial recognition and liveness detection
                </p>
                <Button
                  onClick={() => startVerification('liveness')}
                  disabled={isStartingVerification}
                  variant="outline"
                  className="w-full"
                >
                  {isStartingVerification ? 'Starting...' : 'Start Liveness Check'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {verifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification History</CardTitle>
            <CardDescription>
              View your past identity verification attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(verification.status)}
                    <div>
                      <div className="font-medium">
                        {verification.verification_method.charAt(0).toUpperCase() + verification.verification_method.slice(1)} Verification
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(verification.created_at).toLocaleDateString()} at{' '}
                        {new Date(verification.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {verification.confidence_score && (
                      <div className="text-sm text-gray-600">
                        Score: {(verification.confidence_score * 100).toFixed(0)}%
                      </div>
                    )}
                    <Badge className={getStatusBadge(verification.status)}>
                      {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
