import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Search, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface VerificationDocument {
  id: string;
  observer_id: string;
  document_type: string;
  document_url: string;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
    verification_status: 'pending' | 'verified' | 'rejected';
  };
}

export const VerificationCenter: React.FC = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('verification_documents')
        .select(`
          *,
          profiles!verification_documents_observer_id_fkey(name, email, verification_status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load verification documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const verifyDocument = async (documentId: string, approved: boolean) => {
    try {
      setIsProcessing(true);

      // Update the document verification
      const { error: docError } = await supabase
        .from('verification_documents')
        .update({
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes
        })
        .eq('id', documentId);

      if (docError) throw docError;

      // Update the observer's verification status if approved
      if (selectedDocument && approved) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ verification_status: 'verified' })
          .eq('id', selectedDocument.observer_id);

        if (profileError) throw profileError;
      } else if (selectedDocument && !approved) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ verification_status: 'rejected' })
          .eq('id', selectedDocument.observer_id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Success",
        description: `Document ${approved ? 'approved' : 'rejected'} successfully`
      });

      setIsViewDialogOpen(false);
      setVerificationNotes('');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error verifying document:', error);
      toast({
        title: "Error",
        description: "Failed to process verification",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getDocumentTypeDisplay = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verification Center
          </CardTitle>
          <CardDescription>
            Review and verify observer documentation and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by observer name, email, or document type..."
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
                  <TableHead>Observer</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Verified By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{doc.profiles.name}</div>
                        <div className="text-sm text-gray-500">{doc.profiles.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getDocumentTypeDisplay(doc.document_type)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(doc.profiles.verification_status)}>
                        {doc.profiles.verification_status.charAt(0).toUpperCase() + doc.profiles.verification_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {doc.verified_at ? (
                        <div className="text-sm">
                          <div>Verified</div>
                          <div className="text-gray-500">{new Date(doc.verified_at).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setIsViewDialogOpen(true);
                          setVerificationNotes(doc.verification_notes || '');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No verification documents found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Verification</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Observer Details</h4>
                  <p className="font-medium">{selectedDocument.profiles.name}</p>
                  <p className="text-sm text-gray-500">{selectedDocument.profiles.email}</p>
                  <Badge className={getStatusBadge(selectedDocument.profiles.verification_status)}>
                    {selectedDocument.profiles.verification_status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Document Information</h4>
                  <p>{getDocumentTypeDisplay(selectedDocument.document_type)}</p>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(selectedDocument.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Document Preview</h4>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Document URL: {selectedDocument.document_url}</span>
                  </div>
                  {/* In a real implementation, you'd show the actual document here */}
                  <div className="mt-2 p-4 bg-white border-2 border-dashed border-gray-300 rounded text-center">
                    <p className="text-gray-500">Document preview would be displayed here</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="verificationNotes">Verification Notes</Label>
                <Textarea
                  id="verificationNotes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add notes about this verification..."
                  rows={3}
                />
              </div>

              {!selectedDocument.verified_at && (
                <div className="flex gap-4">
                  <Button
                    onClick={() => verifyDocument(selectedDocument.id, true)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => verifyDocument(selectedDocument.id, false)}
                    disabled={isProcessing}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedDocument.verified_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Document Verified</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Verified on {new Date(selectedDocument.verified_at).toLocaleDateString()}
                  </p>
                  {selectedDocument.verification_notes && (
                    <p className="text-sm text-green-700 mt-2">
                      Notes: {selectedDocument.verification_notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
