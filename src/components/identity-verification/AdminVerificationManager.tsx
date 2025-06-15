
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Search, Eye, CheckCircle, XCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { DiditVerification, DiditAuditLog } from '@/types/didit';

interface VerificationWithProfile extends DiditVerification {
  profiles: {
    name: string;
    email: string;
  };
}

export const AdminVerificationManager: React.FC = () => {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<VerificationWithProfile[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationWithProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<DiditAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    failed: 0
  });

  useEffect(() => {
    fetchVerifications();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [verifications, searchTerm]);

  useEffect(() => {
    calculateStats();
  }, [verifications]);

  const fetchVerifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('didit_verifications')
        .select(`
          *,
          profiles!didit_verifications_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error: any) {
      console.error('Error fetching verifications:', error);
      toast({
        title: "Error",
        description: "Failed to load verifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('didit_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const filterVerifications = () => {
    let filtered = verifications;

    if (searchTerm) {
      filtered = filtered.filter(verification =>
        verification.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.verification_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVerifications(filtered);
  };

  const calculateStats = () => {
    const total = verifications.length;
    const verified = verifications.filter(v => v.status === 'verified').length;
    const pending = verifications.filter(v => v.status === 'pending').length;
    const failed = verifications.filter(v => ['failed', 'expired', 'cancelled'].includes(v.status)).length;

    setStats({ total, verified, pending, failed });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Identity Verifications
          </CardTitle>
          <CardDescription>
            Manage and monitor all identity verification attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, method, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{verification.profiles.name}</div>
                        <div className="text-sm text-gray-500">{verification.profiles.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(verification.status)}
                        <span className="capitalize">{verification.verification_method}</span>
                        {verification.document_type && (
                          <span className="text-sm text-gray-500">({verification.document_type})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(verification.status)}>
                        {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {verification.confidence_score ? (
                        <span className={
                          verification.confidence_score >= 0.8 ? 'text-green-600 font-medium' : 
                          verification.confidence_score >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                        }>
                          {(verification.confidence_score * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(verification.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVerification(verification);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredVerifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No verifications found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Details</DialogTitle>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">User Information</h4>
                  <p className="font-medium">{selectedVerification.profiles.name}</p>
                  <p className="text-sm text-gray-500">{selectedVerification.profiles.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Verification Details</h4>
                  <p>Method: {selectedVerification.verification_method}</p>
                  {selectedVerification.document_type && (
                    <p>Document: {selectedVerification.document_type}</p>
                  )}
                  <Badge className={getStatusBadge(selectedVerification.status)}>
                    {selectedVerification.status}
                  </Badge>
                </div>
              </div>

              {selectedVerification.confidence_score && (
                <div>
                  <h4 className="font-semibold mb-2">Confidence Score</h4>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span>Verification Confidence</span>
                      <span className="font-bold text-lg">
                        {(selectedVerification.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${selectedVerification.confidence_score * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {selectedVerification.extracted_data && (
                <div>
                  <h4 className="font-semibold mb-2">Extracted Data</h4>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(selectedVerification.extracted_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedVerification.error_message && (
                <div>
                  <h4 className="font-semibold mb-2">Error Details</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{selectedVerification.error_message}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Created:</strong> {new Date(selectedVerification.created_at).toLocaleString()}
                </div>
                <div>
                  <strong>Updated:</strong> {new Date(selectedVerification.updated_at).toLocaleString()}
                </div>
                {selectedVerification.verified_at && (
                  <div>
                    <strong>Verified:</strong> {new Date(selectedVerification.verified_at).toLocaleString()}
                  </div>
                )}
                {selectedVerification.expires_at && (
                  <div>
                    <strong>Expires:</strong> {new Date(selectedVerification.expires_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
