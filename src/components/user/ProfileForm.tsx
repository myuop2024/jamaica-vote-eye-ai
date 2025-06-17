
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProfileData } from '@/types/profile';

const JAMAICA_PARISHES = [
  'Kingston',
  'St. Andrew',
  'St. Catherine',
  'Clarendon',
  'Manchester',
  'St. Elizabeth',
  'Westmoreland',
  'Hanover',
  'St. James',
  'Trelawny',
  'St. Ann',
  'St. Mary',
  'Portland',
  'St. Thomas'
];

export const ProfileForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({});

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone_number: user.phoneNumber || '',
        address: user.address || '',
        parish: user.parish || '',
        assigned_station: user.assignedStation || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const updateData = {
        name: String(profileData.name || ''),
        phone_number: String(profileData.phone_number || ''),
        address: String(profileData.address || ''),
        parish: String(profileData.parish || ''),
        assigned_station: String(profileData.assigned_station || '')
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Core profile fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={String(profileData.name || '')}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={String(profileData.phone_number || '')}
                onChange={(e) => handleFieldChange('phone_number', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={String(profileData.address || '')}
                onChange={(e) => handleFieldChange('address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parish">Parish</Label>
              <Select
                value={String(profileData.parish || '')}
                onValueChange={(value) => handleFieldChange('parish', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parish" />
                </SelectTrigger>
                <SelectContent>
                  {JAMAICA_PARISHES.map((parish) => (
                    <SelectItem key={parish} value={parish}>
                      {parish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
