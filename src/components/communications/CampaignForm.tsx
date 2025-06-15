
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Smartphone, Mail, MessageCircle } from 'lucide-react';

interface CampaignFormProps {
  onCampaignSent: () => void;
  selectedTemplate?: string;
  onTemplateUsed?: () => void;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({ 
  onCampaignSent, 
  selectedTemplate = '',
  onTemplateUsed 
}) => {
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

      // Get target recipients - include verification_status in the query
      let recipients = [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email, phone_number, name, verification_status')
        .eq('role', 'observer');

      if (profilesError) throw profilesError;

      switch (targetAudience) {
        case 'verified':
          recipients = profiles?.filter(p => p.verification_status === 'verified') || [];
          break;
        case 'pending':
          recipients = profiles?.filter(p => p.verification_status === 'pending') || [];
          break;
        default:
          recipients = profiles || [];
      }

      // Send messages based on type
      let successCount = 0;
      let failureCount = 0;

      for (const recipient of recipients) {
        try {
          if (communicationType === 'sms' && recipient.phone_number) {
            const { error: smsError } = await supabase.functions.invoke('send-sms', {
              body: {
                to: recipient.phone_number,
                message: messageContent,
                campaignId: communication.id
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
      setCampaignName('');
      setMessageContent('');
      setCommunicationType('sms');
      setTargetAudience('all');

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Create Communication Campaign
        </CardTitle>
        <CardDescription>
          Send messages to observers via SMS, WhatsApp, or Email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Pre-Election Reminder"
            />
          </div>
          <div>
            <Label htmlFor="communicationType">Communication Type</Label>
            <Select value={communicationType} onValueChange={(value: any) => setCommunicationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    SMS
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Select value={targetAudience} onValueChange={setTargetAudience}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Observers</SelectItem>
              <SelectItem value="verified">Verified Observers Only</SelectItem>
              <SelectItem value="pending">Pending Verification</SelectItem>
              <SelectItem value="specific_stations">Specific Stations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="messageContent">Message Content</Label>
          <Textarea
            id="messageContent"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Enter your message here..."
            rows={4}
          />
          <div className="text-sm text-gray-500 mt-1">
            {messageContent.length} characters
          </div>
        </div>

        <Button 
          onClick={sendMessage}
          disabled={isCreating || !campaignName || !messageContent}
          className="bg-green-600 hover:bg-green-700"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending...
            </div>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Campaign
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
