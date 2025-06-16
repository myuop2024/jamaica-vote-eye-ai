
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
      .then(templateFields => {
        console.log('Profile field templates received:', templateFields);
        // Log each field's options to debug
        templateFields.forEach(field => {
          if (field.type === 'select') {
            console.log(`Field ${field.field_key} options:`, field.options);
          }
        });
        setFields(templateFields);
      })
      .catch(e => setError(e.message));
    
    // Fetch user profile data from the existing columns
    supabase
      .from('profiles')
      .select('name, phone_number, address, parish, assigned_station')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        // Map the existing profile columns to our profile data structure
        const mappedData: ProfileData = {
          full_name: data?.name || '',
          phone_number: data?.phone_number || '',
          address: data?.address || '',
          parish: data?.parish || '',
          assigned_station: data?.assigned_station || ''
        };
        setProfileData(mappedData);
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
      // Map our profile data back to the existing profile columns
      const updateData = {
        name: profileData.full_name || '',
        phone_number: profileData.phone_number || '',
        address: profileData.address || '',
        parish: profileData.parish || '',
        assigned_station: profileData.assigned_station || ''
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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

  // Helper function to safely filter options and ensure they're valid for Select component
  const getValidOptions = (options: string[] | undefined) => {
    if (!options || !Array.isArray(options)) {
      console.log('Options is not a valid array:', options);
      return [];
    }
    
    const validOptions = options.filter(opt => {
      const isValid = opt !== null && 
        opt !== undefined && 
        typeof opt === 'string' && 
        opt.trim() !== '' &&
        opt.length > 0;
      
      if (!isValid) {
        console.log('Invalid option filtered out:', opt, typeof opt);
      }
      
      return isValid;
    });
    
    console.log('Valid options after filtering:', validOptions);
    return validOptions;
  };

  // Helper function to determine if a field should render as a select
  const shouldRenderAsSelect = (field: ProfileFieldTemplate) => {
    const validOptions = getValidOptions(field.options);
    const shouldRender = field.type === 'select' && validOptions.length > 0;
    console.log(`Should render select for ${field.field_key}:`, shouldRender, 'Valid options count:', validOptions.length);
    return shouldRender;
  };

  // Helper function to ensure SelectItem value is valid
  const isValidSelectItemValue = (value: any): value is string => {
    const isValid = value !== null && 
      value !== undefined && 
      typeof value === 'string' && 
      value.trim() !== '' &&
      value.length > 0;
    
    console.log('Checking SelectItem value validity:', { value, type: typeof value, isValid });
    return isValid;
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
            .map(field => {
              console.log(`Rendering field: ${field.field_key}, type: ${field.type}`);
              return (
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
                  {shouldRenderAsSelect(field) && (
                    <Select
                      value={profileData[field.field_key] || ''}
                      onValueChange={v => handleChange(field.field_key, v)}
                      required={field.required}
                    >
                      <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                      <SelectContent>
                        {getValidOptions(field.options)
                          .filter(opt => isValidSelectItemValue(opt))
                          .map((opt, index) => {
                            console.log(`Rendering SelectItem ${index} for ${field.field_key}:`, JSON.stringify(opt), 'type:', typeof opt, 'length:', opt.length);
                            
                            return (
                              <SelectItem key={`${field.field_key}-${index}-${opt}`} value={opt}>
                                {opt}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === 'checkbox' && field.options && (
                    <div className="flex flex-col gap-2">
                      {getValidOptions(field.options).map(opt => (
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
              );
            })}
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</Button>
        </form>
      </CardContent>
    </Card>
  );
};
