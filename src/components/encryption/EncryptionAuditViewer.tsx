
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, AlertTriangle, CheckCircle, Clock, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { encryptionService } from './EncryptionService';

interface AuditLog {
  id: string;
  operation_type: string;
  user_id?: string;
  resource_type: string;
  resource_id?: string;
  encryption_algorithm?: string;
  key_version?: number;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  risk_score?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export const EncryptionAuditViewer: React.FC = () => {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [successFilter, setSuccessFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, operationFilter, successFilter]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const data = await encryptionService.getAuditLogs(500);
      setAuditLogs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = auditLogs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.operation_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ip_address && log.ip_address.includes(searchTerm)) ||
        (log.error_message && log.error_message.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (operationFilter !== 'all') {
      filtered = filtered.filter(log => log.operation_type === operationFilter);
    }

    if (successFilter !== 'all') {
      filtered = filtered.filter(log => log.success === (successFilter === 'success'));
    }

    setFilteredLogs(filtered);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'encrypt':
      case 'decrypt':
        return <Shield className="w-4 h-4" />;
      case 'key_rotation':
      case 'key_access':
        return <Key className="w-4 h-4" />;
      case 'authentication':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (success: boolean, riskScore?: number) => {
    if (!success) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
    
    if (riskScore && riskScore > 70) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />High Risk</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Encryption Audit Logs
        </CardTitle>
        <CardDescription>
          Monitor all encryption operations and security events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={operationFilter} onValueChange={setOperationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                <SelectItem value="encrypt">Encrypt</SelectItem>
                <SelectItem value="decrypt">Decrypt</SelectItem>
                <SelectItem value="key_rotation">Key Rotation</SelectItem>
                <SelectItem value="key_access">Key Access</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
              </SelectContent>
            </Select>
            <Select value={successFilter} onValueChange={setSuccessFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Log Table */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getOperationIcon(log.operation_type)}
                    <span className="font-medium capitalize">{log.operation_type.replace('_', ' ')}</span>
                    <Badge variant="outline">{log.resource_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(log.success, log.risk_score)}
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  {log.ip_address && (
                    <div>
                      <span className="font-medium">IP:</span> {log.ip_address}
                    </div>
                  )}
                  {log.encryption_algorithm && (
                    <div>
                      <span className="font-medium">Algorithm:</span> {log.encryption_algorithm}
                    </div>
                  )}
                  {log.key_version && (
                    <div>
                      <span className="font-medium">Key Version:</span> {log.key_version}
                    </div>
                  )}
                  {log.risk_score !== undefined && (
                    <div>
                      <span className="font-medium">Risk Score:</span> 
                      <span className={`ml-1 ${getRiskScoreColor(log.risk_score)}`}>
                        {log.risk_score}/100
                      </span>
                    </div>
                  )}
                </div>
                
                {log.error_message && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                    <span className="font-medium">Error:</span> {log.error_message}
                  </div>
                )}
                
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <span className="font-medium">Metadata:</span> {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No audit logs found matching your criteria
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
