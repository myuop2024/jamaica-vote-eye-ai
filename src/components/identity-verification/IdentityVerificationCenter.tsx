import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { DiditVerificationForm } from './DiditVerificationForm';
import { DiditVerification } from '@/types/didit';

export const IdentityVerificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userVerifications, setUserVerifications] = useState<DiditVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserVerifications();
    }
  }, [user]);

  const fetchUserVerifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('didit_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our DiditVerification type
      const transformedData = (data || []).map(item => ({
        ...item,
        extracted_data: item.extracted_data as Record<string, unknown> || {},
        verification_metadata: item.verification_metadata as Record<string, unknown> || {},
        didit_response: item.didit_response as Record<string, unknown> || {}
      }));
      
      setUserVerifications(transformedData);
    } catch (error) {
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

  const refreshVerificationStatus = async (sessionId: string) => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('didit-verification', {
        body: {
          action: 'check_status',
          session_id: sessionId
        }
      });

      if (error) throw error;

      if (data?.success) {
        await fetchUserVerifications();
        toast({
          title: "Status Updated",
          description: "Verification status has been refreshed",
        });
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh verification status",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const hasActiveVerification = userVerifications.some(v => v.status === 'pending');
  const latestVerification = userVerifications[0];
  const hasVerifiedStatus = userVerifications.some(v => v.status === 'verified');

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <Shield className="w-16 h-16 mx-auto mb-4 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
        <p className="text-lg text-gray-600">
          Secure identity verification for electoral observation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {!hasActiveVerification && !hasVerifiedStatus && (
            <DiditVerificationForm />
          )}
          
          {hasVerifiedStatus && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Identity Verified</span>
                </div>
                <p className="text-sm text-green-700">
                  Your identity has been successfully verified. You can now participate in electoral observation activities.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Verification History
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUserVerifications()}
                  disabled={isRefreshing}
                  className="ml-auto"
                >
                  {isRefreshing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Track your verification attempts and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userVerifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No verification attempts yet</p>
                  <p className="text-sm">Complete your verification above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Method</TableHead>
                        <TableHead className="w-1/4">Document</TableHead>
                        <TableHead className="w-1/4">Date</TableHead>
                        <TableHead className="w-1/4 text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userVerifications.map((verification) => (
                        <TableRow key={verification.id}>
                          <TableCell className="font-medium capitalize">
                            {verification.verification_method}
                          </TableCell>
                          <TableCell className="capitalize">
                            {verification.document_type ? verification.document_type.replace('_', ' ') : '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(verification.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {getStatusBadge(verification.status)}
                              {verification.status === 'pending' && verification.didit_session_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => refreshVerificationStatus(verification.didit_session_id!)}
                                  disabled={isRefreshing}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {latestVerification && latestVerification.status === 'pending' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Verification in Progress</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Your verification is being processed. This usually takes a few minutes.
                  You can close this page and return later to check the status.
                </p>
                {latestVerification.didit_session_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshVerificationStatus(latestVerification.didit_session_id!)}
                    disabled={isRefreshing}
                    className="mt-3"
                  >
                    {isRefreshing ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Check Status
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
