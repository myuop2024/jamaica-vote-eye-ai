
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Mail, AlertCircle, CheckCircle, Trash2, ExternalLink } from 'lucide-react';
import { useEmailAccounts } from './hooks/useEmailAccounts';
import { useToast } from '@/hooks/use-toast';

export const EmailAccountManager: React.FC = () => {
  const { accounts, isLoading, connectGmail, removeAccount } = useEmailAccounts();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGmail = async () => {
    try {
      setIsConnecting(true);
      await connectGmail();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Gmail account",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      await removeAccount(accountId);
      toast({
        title: "Success",
        description: "Email account removed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove email account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gmail Integration</CardTitle>
          <CardDescription>
            Connect your Gmail accounts to manage emails directly from the administration panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gmail integration requires OAuth authentication. A popup window will open for you to authorize access to your Gmail account.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Gmail Account</h3>
                <p className="text-sm text-gray-500">
                  Connect your Gmail account to sync emails
                </p>
              </div>
            </div>
            <Button 
              onClick={handleConnectGmail}
              disabled={isConnecting}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Gmail'}
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {accounts.length === 0 && !isLoading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Gmail accounts connected. Click "Connect Gmail" above to get started.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{account.email_address}</p>
                        <p className="text-sm text-gray-500">
                          Connected on {new Date(account.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={account.is_active ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {account.is_active ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
