
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useCampaignForm } from './useCampaignForm';
import { CampaignBasicInfo } from './CampaignBasicInfo';
import { MessageContentSection } from './MessageContentSection';

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
  const {
    campaignName,
    setCampaignName,
    messageContent,
    setMessageContent,
    communicationType,
    setCommunicationType,
    targetAudience,
    setTargetAudience,
    sendMessage,
    isCreating,
    isFormValid
  } = useCampaignForm({ onCampaignSent, selectedTemplate, onTemplateUsed });

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
        <CampaignBasicInfo
          campaignName={campaignName}
          setCampaignName={setCampaignName}
          communicationType={communicationType}
          setCommunicationType={setCommunicationType}
          targetAudience={targetAudience}
          setTargetAudience={setTargetAudience}
        />

        <MessageContentSection
          messageContent={messageContent}
          setMessageContent={setMessageContent}
        />

        <Button 
          onClick={sendMessage}
          disabled={isCreating || !isFormValid}
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
