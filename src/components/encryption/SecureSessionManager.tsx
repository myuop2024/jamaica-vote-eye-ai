import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Monitor, AlertTriangle, CheckCircle, Smartphone, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecureSession {
  id: string;
  user_id: string;
  session_token_hash: string;
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
  encryption_level: 'standard' | 'enhanced' | 'military';
  mfa_verified: boolean;
  risk_assessment: Record<string, any>;
  expires_at: string;
  last_activity: string;
  created_at: string;
}

export const SecureSessionManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SecureSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSecureSessions();
    }
  }, [user]);

  const loadSecureSessions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('secure_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      
      // Transform the database response to match our interface
      const transformedSessions: SecureSession[] = (data || []).map(session => ({
        id: session.id,
        user_id: session.user_id,
        session_token_hash: session.session_token_hash,
        device_fingerprint: session.device_fingerprint,
        ip_address: session.ip_address as string,
        user_agent: session.user_agent,
        encryption_level: session.encryption_level as 'standard' | 'enhanced' | 'military',
        mfa_verified: session.mfa_verified,
        risk_assessment: session.risk_assessment as Record<string, any>,
        expires_at: session.expires_at,
        last_activity: session.last_activity,
        created_at: session.created_at
      }));
      
      setSessions(transformedSessions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load secure sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('secure_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session Revoked",
        description: "The session has been successfully revoked",
      });

      await loadSecureSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive"
      });
    }
  };

  const getEncryptionBadge = (level: string) => {
    const styles = {
      'standard': 'bg-blue-100 text-blue-800',
      'enhanced': 'bg-yellow-100 text-yellow-800',
      'military': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={styles[level as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        <Shield className="w-3 h-3 mr-1" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="w-4 h-4" />;
    
    if (userAgent.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-4 h-4" />;
    }
    
    return <Monitor className="w-4 h-4" />;
  };

  const getRiskBadge = (riskAssessment: Record<string, any>) => {
    const riskScore = riskAssessment.risk_score || 0;
    
    if (riskScore >= 70) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />High Risk</Badge>;
    } else if (riskScore >= 40) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Medium Risk</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Low Risk</Badge>;
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Secure Sessions
        </CardTitle>
        <CardDescription>
          Monitor and manage your active secure sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(session.user_agent)}
                  <span className="font-medium">
                    {session.device_fingerprint ? `Device ${session.device_fingerprint.slice(0, 8)}...` : 'Unknown Device'}
                  </span>
                  {getEncryptionBadge(session.encryption_level)}
                </div>
                <div className="flex items-center gap-2">
                  {getRiskBadge(session.risk_assessment)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">IP Address:</span> {session.ip_address || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">MFA Verified:</span> 
                  {session.mfa_verified ? (
                    <CheckCircle className="w-4 h-4 text-green-500 inline ml-1" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 inline ml-1" />
                  )}
                </div>
                <div>
                  <span className="font-medium">Last Activity:</span> {new Date(session.last_activity).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Expires:</span> {new Date(session.expires_at).toLocaleString()}
                </div>
              </div>
              
              {session.user_agent && (
                <div className="mt-2 text-xs text-gray-500 truncate">
                  <span className="font-medium">User Agent:</span> {session.user_agent}
                </div>
              )}
              
              {session.risk_assessment && Object.keys(session.risk_assessment).length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <span className="font-medium">Risk Assessment:</span> {JSON.stringify(session.risk_assessment)}
                </div>
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active secure sessions found</p>
              <p className="text-sm">Sessions will appear here when you log in with enhanced security</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
