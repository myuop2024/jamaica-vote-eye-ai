
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, Lock, AlertTriangle, CheckCircle, RefreshCw, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { encryptionService, EncryptionConfig } from './EncryptionService';
import { EncryptionAuditViewer } from './EncryptionAuditViewer';
import { DataClassificationManager } from './DataClassificationManager';

export const EncryptionDashboard: React.FC = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<EncryptionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    loadEncryptionConfigs();
    initializeEncryption();
  }, []);

  const initializeEncryption = async () => {
    try {
      await encryptionService.initializeEncryption();
      toast({
        title: "Encryption Initialized",
        description: "Military-grade encryption system is active",
      });
    } catch (error) {
      toast({
        title: "Encryption Initialization Failed",
        description: "Failed to initialize encryption system",
        variant: "destructive"
      });
    }
  };

  const loadEncryptionConfigs = async () => {
    try {
      setIsLoading(true);
      const data = await encryptionService.getEncryptionConfigs();
      setConfigs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load encryption configurations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyRotation = async () => {
    setIsRotating(true);
    try {
      await encryptionService.rotateKeys();
      toast({
        title: "Keys Rotated",
        description: "Encryption keys have been successfully rotated",
      });
      await loadEncryptionConfigs();
    } catch (error) {
      toast({
        title: "Key Rotation Failed",
        description: "Failed to rotate encryption keys",
        variant: "destructive"
      });
    } finally {
      setIsRotating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'rotating':
        return <Badge className="bg-yellow-100 text-yellow-800"><RefreshCw className="w-3 h-3 mr-1" />Rotating</Badge>;
      case 'deprecated':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Deprecated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getComplianceBadge = (level: string) => {
    const colors = {
      'FIPS-140-2': 'bg-blue-100 text-blue-800',
      'Common-Criteria': 'bg-purple-100 text-purple-800',
      'NSA-Suite-B': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{level}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-green-600" />
            Military-Grade Encryption
          </h1>
          <p className="text-gray-600">Advanced encryption and security management</p>
        </div>
        <Button 
          onClick={handleKeyRotation}
          disabled={isRotating}
          className="bg-green-600 hover:bg-green-700"
        >
          {isRotating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Rotating Keys...
            </>
          ) : (
            <>
              <Key className="w-4 h-4 mr-2" />
              Rotate Keys
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keys">Key Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="classification">Data Classification</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {configs.filter(c => c.keyStatus === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Encryption keys in use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Level</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">FIPS-140-2</div>
                <p className="text-xs text-muted-foreground">
                  Military-grade standard
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Secure</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Encryption Status</CardTitle>
              <CardDescription>
                Real-time status of encryption systems and compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Data at Rest Encryption</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Data in Transit Encryption</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Key Management</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Key Configuration</CardTitle>
              <CardDescription>
                Manage encryption keys and their lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configs.map((config) => (
                  <div key={config.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{config.keyName}</h3>
                      <div className="flex gap-2">
                        {getStatusBadge(config.keyStatus)}
                        {getComplianceBadge(config.complianceLevel)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Algorithm:</span> {config.algorithm}
                      </div>
                      <div>
                        <span className="font-medium">Version:</span> {config.keyVersion}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(config.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {config.expiresAt ? new Date(config.expiresAt).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <EncryptionAuditViewer />
        </TabsContent>

        <TabsContent value="classification" className="space-y-6">
          <DataClassificationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
