
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Database, AlertTriangle, CheckCircle, Eye, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DataClassification {
  id: string;
  table_name: string;
  column_name: string;
  classification_level: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  encryption_required: boolean;
  access_control_policy: Record<string, any>;
  audit_requirements: Record<string, any>;
  retention_period_days: number;
  created_at: string;
}

export const DataClassificationManager: React.FC = () => {
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<DataClassification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDataClassifications();
  }, []);

  const loadDataClassifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('data_classification')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the database response to match our interface
      const transformedClassifications: DataClassification[] = (data || []).map(classification => ({
        id: classification.id,
        table_name: classification.table_name,
        column_name: classification.column_name,
        classification_level: classification.classification_level as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET',
        encryption_required: classification.encryption_required,
        access_control_policy: classification.access_control_policy as Record<string, any>,
        audit_requirements: classification.audit_requirements as Record<string, any>,
        retention_period_days: classification.retention_period_days,
        created_at: classification.created_at
      }));
      
      setClassifications(transformedClassifications);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data classifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getClassificationBadge = (level: string) => {
    const styles = {
      'PUBLIC': 'bg-green-100 text-green-800',
      'INTERNAL': 'bg-blue-100 text-blue-800',
      'CONFIDENTIAL': 'bg-yellow-100 text-yellow-800',
      'SECRET': 'bg-orange-100 text-orange-800',
      'TOP_SECRET': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={styles[level as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {level.replace('_', ' ')}
      </Badge>
    );
  };

  const getEncryptionIcon = (required: boolean) => {
    return required ? (
      <Lock className="w-4 h-4 text-red-600" />
    ) : (
      <Eye className="w-4 h-4 text-gray-400" />
    );
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
          <Database className="w-5 h-5" />
          Data Classification
        </CardTitle>
        <CardDescription>
          Manage data classification levels and security policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classifications.map((classification) => (
            <div key={classification.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span className="font-medium">
                    {classification.table_name}.{classification.column_name}
                  </span>
                  {getClassificationBadge(classification.classification_level)}
                </div>
                <div className="flex items-center gap-2">
                  {getEncryptionIcon(classification.encryption_required)}
                  <span className="text-sm text-gray-600">
                    {classification.encryption_required ? 'Encrypted' : 'Not Encrypted'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Retention:</span> {classification.retention_period_days} days
                </div>
                <div>
                  <span className="font-medium">Access Policy:</span> 
                  {Object.keys(classification.access_control_policy).length > 0 ? 'Configured' : 'Default'}
                </div>
                <div>
                  <span className="font-medium">Audit:</span>
                  {Object.keys(classification.audit_requirements).length > 0 ? 'Required' : 'Optional'}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(classification.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {Object.keys(classification.access_control_policy).length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <span className="font-medium">Access Policy:</span> {JSON.stringify(classification.access_control_policy)}
                </div>
              )}
            </div>
          ))}
          
          {classifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No data classifications found</p>
              <p className="text-sm">Classification rules will appear here when configured</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
