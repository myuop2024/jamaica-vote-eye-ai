
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EmailMessage } from '../types';

export const useEmailMessages = (accountId?: string, type: 'inbox' | 'sent' = 'inbox') => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        setMessages([]);
        return;
      }

      let query = supabase
        .from('email_messages')
        .select(`
          *,
          email_accounts!inner(email_address, user_id)
        `)
        .eq('is_sent', type === 'sent')
        .eq('email_accounts.user_id', user.id)
        .order('received_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('email_account_id', accountId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('email_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const syncMessages = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsSyncing(true);

      // Get active accounts to sync
      const { data: accounts } = await supabase
        .from('email_accounts')
        .select('id, email_address')
        .eq('is_active', true)
        .eq('user_id', user.id);

      if (!accounts || accounts.length === 0) {
        toast({
          title: "Info",
          description: "No active email accounts to sync",
          variant: "default"
        });
        return;
      }

      // Determine which account to sync
      const accountToSync = accountId 
        ? accounts.find(acc => acc.id === accountId)
        : accounts[0];

      if (!accountToSync) {
        throw new Error('No valid account found for syncing');
      }

      // Call the Gmail sync edge function
      const { data, error } = await supabase.functions.invoke('gmail-sync-messages', {
        body: {
          accountId: accountToSync.id,
          maxResults: 50
        }
      });

      if (error) throw error;

      // Refresh messages after sync
      await fetchMessages();
      
      toast({
        title: "Success",
        description: `Synced ${data.syncedCount} messages from ${accountToSync.email_address}`
      });
    } catch (error: any) {
      console.error('Error syncing messages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync messages",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    } else {
      setIsLoading(false);
      setMessages([]);
    }
  }, [accountId, type, user]);

  return {
    messages,
    isLoading,
    isSyncing,
    fetchMessages,
    markAsRead,
    syncMessages
  };
};
