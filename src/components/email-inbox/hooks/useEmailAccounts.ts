
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface EmailAccount {
  id: string;
  email_address: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmailAccounts = () => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        setAccounts([]);
        return;
      }

      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error fetching email accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load email accounts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Starting Gmail OAuth flow for user:', user.id);

      // Call the edge function to initiate OAuth
      const { data, error } = await supabase.functions.invoke('gmail-oauth-exchange', {
        body: {
          action: 'initiate',
          userId: user.id
        }
      });

      if (error) {
        console.error('OAuth initiation error:', error);
        throw new Error(error.message || 'Failed to initiate Gmail OAuth');
      }

      if (!data?.authUrl) {
        throw new Error('No OAuth URL received from server');
      }

      console.log('Opening OAuth URL:', data.authUrl);

      // Open OAuth popup
      const popup = window.open(
        data.authUrl,
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Check if popup was blocked
      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      }

      // Listen for the OAuth callback
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Refresh accounts after OAuth flow
          setTimeout(() => {
            fetchAccounts();
          }, 1000);
        }
      }, 1000);

      // Listen for message from popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        console.log('Received message from popup:', event.data);
        
        if (event.data.type === 'GMAIL_OAUTH_SUCCESS') {
          popup?.close();
          toast({
            title: "Success",
            description: "Gmail account connected successfully"
          });
          fetchAccounts();
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'GMAIL_OAUTH_ERROR') {
          popup?.close();
          console.error('OAuth error:', event.data.error);
          toast({
            title: "Error",
            description: event.data.error || "Failed to connect Gmail account",
            variant: "destructive"
          });
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);

    } catch (error: any) {
      console.error('Error connecting Gmail:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect Gmail account",
        variant: "destructive"
      });
    }
  };

  const removeAccount = async (accountId: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh the accounts list
      await fetchAccounts();
      
      toast({
        title: "Success",
        description: "Email account removed successfully"
      });
    } catch (error: any) {
      console.error('Error removing account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove account",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    } else {
      setIsLoading(false);
      setAccounts([]);
    }
  }, [user]);

  return {
    accounts,
    isLoading,
    fetchAccounts,
    connectGmail,
    removeAccount
  };
};
