
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Shield, Database, Lock, Eye, AlertTriangle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DataClassification {
  id: string;
  table_name: string;
  column_name: string;
  classification_level: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  encryption_required: boolean;
  retention_period_days?: number;
  access_control_policy: Record<string, any>;
  audit_requirements: Record<string, any>;
  created_at: string;
}

export const DataClassificationManager: React.FC = () => {
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<DataClassification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tableName: '',
    columnName: '',
    classificationLevel: 'INTERNAL' as const,
    encryptionRequired: true,
    retentionPeriodDays: ''
  });

  useEffect(() => {
    loadClassifications();
  }, []);

  const loadClassifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('data_classification')
        .select('*')
        .order('classification_level', { ascending: false });

      if (error) throw error;
      setClassifications(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('data_classification')
        .insert({
          table_name: formData.tableName,
          column_name: formData.columnName,
          classification_level: formData.classificationLevel,
          encryption_required: formData.encryptionRequired,
          retention_period_days: formData.retentionPeriodDays ? parseInt(formData.retentionPeriodDays) : null,
          access_control_policy: {},
          audit_requirements: {}
        });

      if (error) throw error;

      toast({
        title: "Classification Added",
        description: "Data classification has been successfully added",
      });

      setIsDialogOpen(false);
      setFormData({
        tableName: '',
        columnName: '',
        classificationLevel: 'INTERNAL',
        encryptionRequired: true,
        retentionPeriodDays: ''
      });
      await loadClassifications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add data classification",
        variant: "destructive"
      });
    }
  };

  const getClassificationBadge = (level: string) => {
    const styles = {
      'PUBLIC': 'bg-gray-100 text-gray-800',
      'INTERNAL': 'bg-blue-100 text-blue-800',
      'CONFIDENTIAL': 'bg-yellow-100 text-yellow-800',
      'SECRET': 'bg-orange-100 text-orange-800',
      'TOP_SECRET': 'bg-red-100 text-red-800'
    };
    
    const icons = {
      'PUBLIC': Eye,
      'INTERNAL': Database,
      'CONFIDENTIAL': Lock,
      'SECRET': Shield,
      'TOP_SECRET': AlertTriangle
    };
    
    const Icon = icons[level as keyof typeof icons] || Database;
    
    return (
      <Badge className={styles[level as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        <Icon className="w-3 h-3 mr-1" />
        {level}
      </Badge>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Classification
            </CardTitle>
            <CardDescription>
              Manage data sensitivity levels and encryption requirements
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Classification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Data Classification</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input
                    id="table-name"
                    value={formData.tableName}
                    onChange={(e) => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
                    placeholder="e.g., profiles"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="column-name">Column Name</Label>
                  <Input
                    id="column-name"
                    value={formData.columnName}
                    onChange={(e) => setFormData(prev => ({ ...prev, columnName: e.target.value }))}
                    placeholder="e.g., email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="classification-level">Classification Level</Label>
                  <Select
                    value={formData.classificationLevel}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, classificationLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                      <SelectItem value="INTERNAL">INTERNAL</SelectItem>
                      <SelectItem value="CONFIDENTIAL">CONFIDENTIAL</SelectItem>
                      <SelectItem value="SECRET">SECRET</SelectItem>
                      <SelectItem value="TOP_SECRET">TOP SECRET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retention-period">Retention Period (Days)</Label>
                  <Input
                    id="retention-period"
                    type="number"
                    value={formData.retentionPeriodDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, retentionPeriodDays: e.target.value }))}
                    placeholder="e.g., 2555 (7 years)"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="encryption-required"
                    checked={formData.encryptionRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, encryptionRequired: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="encryption-required">Encryption Required</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Classification</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classifications.map((classification) => (
            <div key={classification.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{classification.table_name}.{classification.column_name}</span>
                  {getClassificationBadge(classification.classification_level)}
                </div>
                <div className="flex items-center gap-2">
                  {classification.encryption_required && (
                    <Badge className="bg-green-100 text-green-800">
                      <Lock className="w-3 h-3 mr-1" />
                      Encrypted
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Classification:</span> {classification.classification_level}
                </div>
                <div>
                  <span className="font-medium">Encryption:</span> {classification.encryption_required ? 'Required' : 'Optional'}
                </div>
                <div>
                  <span className="font-medium">Retention:</span> {
                    classification.retention_period_days 
                      ? `${classification.retention_period_days} days`
                      : 'Indefinite'
                  }
                </div>
              </div>
            </div>
          ))}
          
          {classifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data classifications found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
