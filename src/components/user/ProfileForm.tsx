
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

  // Enhanced validation function for select values
  const isValidSelectValue = (value: any): value is string => {
    const isValid = typeof value === 'string' && value.trim().length > 0;
    console.log('Validating select value:', { value, isValid });
    return isValid;
  };

  // Get safe options with comprehensive validation and logging
  const getSafeSelectOptions = (options: string[] | undefined, fieldKey: string): string[] => {
    console.log(`Processing options for field ${fieldKey}:`, options);
    
    if (!Array.isArray(options)) {
      console.log(`No options array for field ${fieldKey}`);
      return [];
    }
    
    const validOptions = options
      .filter((option, index) => {
        const isValid = isValidSelectValue(option);
        if (!isValid) {
          console.warn(`Invalid option at index ${index} for field ${fieldKey}:`, option);
        }
        return isValid;
      })
      .map(option => option.trim())
      .filter(option => option.length > 0);
    
    console.log(`Valid options for field ${fieldKey}:`, validOptions);
    return validOptions;
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
              // Handle select fields with ultimate safety and logging
              if (field.type === 'select') {
                const safeOptions = getSafeSelectOptions(field.options, field.field_key);
                
                // Don't render select if no safe options
                if (safeOptions.length === 0) {
                  console.warn(`No valid options for select field ${field.field_key}, skipping render`);
                  return null;
                }
                
                return (
                  <div key={field.field_key} className="space-y-2">
                    <Label>{field.label}{field.required && ' *'}</Label>
                    <Select
                      value={profileData[field.field_key] || ''}
                      onValueChange={v => handleChange(field.field_key, v)}
                      required={field.required}
                    >
                      <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                      <SelectContent>
                        {safeOptions.map((option, index) => {
                          // Final safety check before rendering each SelectItem
                          if (!isValidSelectValue(option)) {
                            console.error(`Attempting to render invalid SelectItem for ${field.field_key} at index ${index}:`, option);
                            return null;
                          }
                          
                          return (
                            <SelectItem key={`${field.field_key}-${index}-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              
              // Handle all other field types
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
                  {field.type === 'checkbox' && field.options && (
                    <div className="flex flex-col gap-2">
                      {getSafeSelectOptions(field.options, field.field_key).map(opt => (
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
