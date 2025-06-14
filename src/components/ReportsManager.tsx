
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Search, Eye, Flag, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ObservationReport {
  id: string;
  observer_id: string;
  station_id?: string;
  report_text: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'flagged';
  attachments: any[];
  location_data?: any;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

export const ReportsManager: React.FC = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<ObservationReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ObservationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ObservationReport | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('observation_reports')
        .select(`
          *,
          profiles!inner(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.report_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.station_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  };

  const updateReportStatus = async (reportId: string, status: 'submitted' | 'under_review' | 'resolved' | 'flagged') => {
    try {
      const { error } = await supabase
        .from('observation_reports')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report status updated successfully"
      });

      fetchReports();
    } catch (error: any) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      flagged: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="w-4 h-4" />;
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'flagged':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reports Management
          </CardTitle>
          <CardDescription>
            Review and manage observation reports from field observers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Observer</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Report Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.profiles.name}</div>
                        <div className="text-sm text-gray-500">{report.profiles.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{report.station_id || 'Not specified'}</TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate">
                        {report.report_text}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(report.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(report.status)}
                          {report.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Select
                          value={report.status}
                          onValueChange={(value) => updateReportStatus(report.id, value as any)}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="flagged">Flagged</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reports found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Observation Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Observer</h4>
                  <p>{selectedReport.profiles.name}</p>
                  <p className="text-sm text-gray-500">{selectedReport.profiles.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Station</h4>
                  <p>{selectedReport.station_id || 'Not specified'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Report Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedReport.report_text}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge className={getStatusBadge(selectedReport.status)}>
                    {selectedReport.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Submitted</h4>
                  <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Last Updated</h4>
                  <p>{new Date(selectedReport.updated_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedReport.attachments.map((attachment, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <p className="text-sm">{attachment.name || `Attachment ${index + 1}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
