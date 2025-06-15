
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseCampaignFormProps {
  onCampaignSent: () => void;
  selectedTemplate?: string;
  onTemplateUsed?: () => void;
}

export const useCampaignForm = ({ 
  onCampaignSent, 
  selectedTemplate = '',
  onTemplateUsed 
}: UseCampaignFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [communicationType, setCommunicationType] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [targetAudience, setTargetAudience] = useState('all');

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate) {
      setMessageContent(selectedTemplate);
      onTemplateUsed?.();
    }
  }, [selectedTemplate, onTemplateUsed]);

  const getTargetRecipients = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, phone_number, name, verification_status')
      .eq('role', 'observer');

    if (profilesError) throw profilesError;

    switch (targetAudience) {
      case 'verified':
        return profiles?.filter(p => p.verification_status === 'verified') || [];
      case 'pending':
        return profiles?.filter(p => p.verification_status === 'pending') || [];
      default:
        return profiles || [];
    }
  };

  const sendMessagesToRecipients = async (recipients: any[], communicationId: string) => {
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of recipients) {
      try {
        if (communicationType === 'sms' && recipient.phone_number) {
          const { error: smsError } = await supabase.functions.invoke('send-sms', {
            body: {
              to: recipient.phone_number,
              message: messageContent,
              campaignId: communicationId
            }
          });
          
          if (smsError) throw smsError;
          successCount++;
        } else if (communicationType === 'email' && recipient.email) {
          // Email sending would be implemented here
          successCount++;
        } else if (communicationType === 'whatsapp' && recipient.phone_number) {
          // WhatsApp sending would be implemented here
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to send to ${recipient.email || recipient.phone_number}:`, error);
        failureCount++;
      }
    }

    return { successCount, failureCount };
  };

  const sendMessage = async () => {
    if (!campaignName || !messageContent || !user?.id) return;

    try {
      setIsCreating(true);

      // Create communication record
      const { data: communication, error: createError } = await supabase
        .from('communications')
        .insert({
          campaign_name: campaignName,
          message_content: messageContent,
          communication_type: communicationType,
          target_audience: targetAudience,
          sent_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get target recipients
      const recipients = await getTargetRecipients();

      // Send messages
      const { successCount, failureCount } = await sendMessagesToRecipients(recipients, communication.id);

      // Update communication status
      await supabase
        .from('communications')
        .update({
          status: successCount > 0 ? 'sent' : 'failed',
          sent_count: successCount,
          failed_count: failureCount,
          sent_at: new Date().toISOString()
        })
        .eq('id', communication.id);

      toast({
        title: "Messages Sent",
        description: `Successfully sent ${successCount} messages. ${failureCount} failed.`
      });

      // Reset form
      resetForm();
      onCampaignSent();
    } catch (error: any) {
      console.error('Error sending messages:', error);
      toast({
        title: "Error",
        description: "Failed to send messages",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setCampaignName('');
    setMessageContent('');
    setCommunicationType('sms');
    setTargetAudience('all');
  };

  return {
    // Form state
    campaignName,
    setCampaignName,
    messageContent,
    setMessageContent,
    communicationType,
    setCommunicationType,
    targetAudience,
    setTargetAudience,
    
    // Actions
    sendMessage,
    isCreating,
    
    // Validation
    isFormValid: !!(campaignName && messageContent)
  };
};
