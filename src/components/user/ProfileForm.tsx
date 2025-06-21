
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProfileData, UserProfile } from '@/types/profile'; // Assuming UserProfile includes new fields
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateToDisplay, parseDisplayDateToISO, formatDateToISO, parseDisplayDateToDateObject } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';


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
  const { user, refreshUserProfile } = useAuth(); // Assuming refreshUserProfile updates AuthContext
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [parish, setParish] = useState('');
  // Add state for DOB
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  // Unique User ID will be displayed, not edited by user
  const [uniqueUserIdDisplay, setUniqueUserIdDisplay] = useState('');


  useEffect(() => {
    if (user) {
      // Cast user to UserProfile to access all fields
      const userProfile = user as UserProfile;
      setName(userProfile.name || '');
      setPhoneNumber(userProfile.phone_number || '');
      setAddress(userProfile.address || '');
      setParish(userProfile.parish || '');
      setUniqueUserIdDisplay(userProfile.unique_user_id || 'N/A');

      // Initialize dateOfBirth from user profile
      if (userProfile.date_of_birth) {
        // Supabase returns date as YYYY-MM-DD string
        const dobDate = parseDisplayDateToDateObject(formatDateToDisplay(userProfile.date_of_birth));
        setDateOfBirth(dobDate || undefined);
      } else {
        setDateOfBirth(undefined);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (dateOfBirth && dateOfBirth > new Date()) {
        toast({ title: "Invalid Date", description: "Date of Birth cannot be in the future.", variant: "destructive"});
        return;
    }

    setIsLoading(true);
    try {
      const updateData: Partial<UserProfile> = {
        name: name,
        phone_number: phoneNumber,
        address: address,
        parish: parish,
        // Format DOB for Supabase (YYYY-MM-DD)
        date_of_birth: dateOfBirth ? formatDateToISO(dateOfBirth) : null,
      };
      // Note: unique_user_id is not updated from here. It's set once.

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      if(refreshUserProfile) refreshUserProfile(); // Refresh context user data

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details. Your Unique User ID is <span className="font-semibold">{uniqueUserIdDisplay}</span>.
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? formatDateFns(dateOfBirth, "dd/MM/yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01") || isLoading}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parish">Parish</Label>
              <Select
                value={parish}
                onValueChange={(value) => setParish(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parish" />
                </SelectTrigger>
                <SelectContent>
                  {JAMAICA_PARISHES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uniqueUserId">Unique User ID</Label>
              <Input
                id="uniqueUserId"
                type="text"
                value={uniqueUserIdDisplay}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
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
