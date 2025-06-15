
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Mail, MessageCircle } from 'lucide-react';

interface CampaignBasicInfoProps {
  campaignName: string;
  setCampaignName: (value: string) => void;
  communicationType: 'sms' | 'whatsapp' | 'email';
  setCommunicationType: (value: 'sms' | 'whatsapp' | 'email') => void;
  targetAudience: string;
  setTargetAudience: (value: string) => void;
}

export const CampaignBasicInfo: React.FC<CampaignBasicInfoProps> = ({
  campaignName,
  setCampaignName,
  communicationType,
  setCommunicationType,
  targetAudience,
  setTargetAudience
}) => {
  return (
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

      <div className="md:col-span-2">
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
    </div>
  );
};
