
import React, { useEffect, useState } from 'react';
import { getAllProfileFieldTemplates } from '@/services/profileFieldTemplateService';
import { ProfileFieldTemplate, ProfileData } from '@/types/profile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const ProfileForm: React.FC<{ userId: string }> = ({ userId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<ProfileFieldTemplate[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllProfileFieldTemplates()
      .then(setFields)
      .catch(e => setError(e.message));
    // Fetch user profile_data
    supabase
      .from('profiles')
      .select('profile_data')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        setProfileData(data?.profile_data || {});
      });
  }, [userId]);

  const handleChange = (key: string, value: any) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = () => {
    for (const field of fields) {
      if (field.required && !profileData[field.field_key]) {
        setError(`${field.label} is required.`);
        return false;
      }
      if (field.validation && profileData[field.field_key]) {
        try {
          const re = new RegExp(field.validation);
          if (!re.test(profileData[field.field_key])) {
            setError(`${field.label} is invalid.`);
            return false;
          }
        } catch {
          // Ignore invalid regex
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_data: profileData })
        .eq('id', userId);
      if (error) throw error;
      setSuccess('Profile updated successfully.');
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    } catch (e: any) {
      setError(e.message);
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {fields
            .filter(f => f.visible_to_user && (!f.roles || f.roles.includes(user?.role)))
            .sort((a, b) => a.order - b.order)
            .map(field => (
              <div key={field.field_key} className="space-y-2">
                <Label>{field.label}{field.required && ' *'}</Label>
                {field.type === 'text' && (
                  <Input
                    value={profileData[field.field_key] || ''}
                    onChange={e => handleChange(field.field_key, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === 'number' && (
                  <Input
                    type="number"
                    value={profileData[field.field_key] || ''}
                    onChange={e => handleChange(field.field_key, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === 'date' && (
                  <Input
                    type="date"
                    value={profileData[field.field_key] || ''}
                    onChange={e => handleChange(field.field_key, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === 'select' && field.options && (
                  <Select
                    value={profileData[field.field_key] || ''}
                    onValueChange={v => handleChange(field.field_key, v)}
                    required={field.required}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {field.options.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === 'checkbox' && field.options && (
                  <div className="flex flex-col gap-2">
                    {field.options.map(opt => (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Array.isArray(profileData[field.field_key]) && profileData[field.field_key].includes(opt)}
                          onChange={e => {
                            const arr = Array.isArray(profileData[field.field_key]) ? [...profileData[field.field_key]] : [];
                            if (e.target.checked) arr.push(opt);
                            else arr.splice(arr.indexOf(opt), 1);
                            handleChange(field.field_key, arr);
                          }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'file' && (
                  <Input
                    type="file"
                    onChange={e => handleChange(field.field_key, e.target.files?.[0])}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</Button>
        </form>
      </CardContent>
    </Card>
  );
};
