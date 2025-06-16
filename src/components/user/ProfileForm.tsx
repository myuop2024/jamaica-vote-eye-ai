
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProfileFieldTemplate, ProfileData } from '@/types/profile';

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
  const [templates, setTemplates] = useState<ProfileFieldTemplate[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({});

  useEffect(() => {
    // Skip fetching templates since the table doesn't exist in the current schema
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

      // Note: refreshUser is not available in the current AuthContext
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

  const isValidSelectItemValue = (value: unknown): value is string => {
    return typeof value === 'string' && value.trim() !== '';
  };

  const getValidOptions = (options: unknown): string[] => {
    if (!Array.isArray(options)) return [];
    return options.filter(isValidSelectItemValue);
  };

  const shouldRenderAsSelect = (template: ProfileFieldTemplate): boolean => {
    if (template.type !== 'select') return false;
    const validOptions = getValidOptions(template.options);
    return validOptions.length > 0;
  };

  const renderField = (template: ProfileFieldTemplate) => {
    const fieldValue = String(profileData[template.field_key] || '');

    if (template.field_key === 'parish') {
      return (
        <div key={template.id} className="space-y-2">
          <Label htmlFor={template.field_key}>{template.label}</Label>
          <Select
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(template.field_key, value)}
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
      );
    }

    if (shouldRenderAsSelect(template)) {
      const validOptions = getValidOptions(template.options);
      return (
        <div key={template.id} className="space-y-2">
          <Label htmlFor={template.field_key}>{template.label}</Label>
          <Select
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(template.field_key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${template.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {validOptions.map((option) => {
                const optionValue = String(option);
                if (!isValidSelectItemValue(optionValue)) {
                  console.warn(`Skipping invalid option for ${template.field_key}:`, option);
                  return null;
                }
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Default to text input for other field types
    return (
      <div key={template.id} className="space-y-2">
        <Label htmlFor={template.field_key}>{template.label}</Label>
        <Input
          id={template.field_key}
          type={template.type === 'number' ? 'number' : 'text'}
          value={fieldValue}
          onChange={(e) => handleFieldChange(template.field_key, e.target.value)}
          required={template.required}
        />
      </div>
    );
  };

  const getUserRoles = (): string[] => {
    if (!user?.role) return [];
    return Array.isArray(user.role) ? user.role : [user.role];
  };

  const filteredTemplates = templates.filter(template => {
    if (!template.roles || template.roles.length === 0) return true;
    const userRoles = getUserRoles();
    const templateRoles = Array.isArray(template.roles) ? template.roles : [];
    return templateRoles.some(role => userRoles.includes(role));
  });

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

            {/* Dynamic fields from templates */}
            {filteredTemplates.map(renderField)}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
