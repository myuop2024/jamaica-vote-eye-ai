
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
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
    // This would typically involve OAuth flow with Gmail
    // For now, we'll simulate the connection
    const mockEmail = `admin${Date.now()}@example.com`;
    
    const { error } = await supabase
      .from('email_accounts')
      .insert({
        email_address: mockEmail,
        provider: 'gmail',
        is_active: true,
        access_token: 'mock_token',
        refresh_token: 'mock_refresh_token'
      });

    if (error) throw error;
    
    // Refresh the accounts list
    await fetchAccounts();
  };

  const removeAccount = async (accountId: string) => {
    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
    
    // Refresh the accounts list
    await fetchAccounts();
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    isLoading,
    fetchAccounts,
    connectGmail,
    removeAccount
  };
};
