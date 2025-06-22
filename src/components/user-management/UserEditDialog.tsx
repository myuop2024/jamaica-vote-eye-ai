
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddressInput } from '@/components/address/AddressInput';
import { JAMAICAN_PARISHES } from '@/services/hereMapsService';
import { User } from '@/types/auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { formatDateToDisplay, formatDateToISO, parseDisplayDateToDateObject } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';

interface UserEditDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Separate state for form fields for clarity
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'admin' | 'observer' | 'parish_coordinator' | 'roving_observer'>('observer');
  const [assignedStation, setAssignedStation] = useState('');
  const [deploymentParish, setDeploymentParish] = useState('');
  const [parish, setParish] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('');
  const [trn, setTrn] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [uniqueUserIdDisplay, setUniqueUserIdDisplay] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setRole(user.role || 'observer');
      setAssignedStation(user.assignedStation || '');
      setDeploymentParish(user.deploymentParish || '');
      setParish(user.parish || '');
      setAddress(user.address || '');
      setBankName(user.bankName || '');
      setBankAccountNumber(user.bankAccountNumber || '');
      setBankRoutingNumber(user.bankRoutingNumber || '');
      setTrn(user.trn || '');
      setVerificationStatus(user.verificationStatus || 'pending');
      setUniqueUserIdDisplay(user.unique_user_id || 'N/A');

      if (user.date_of_birth) {
        const dobDate = parseDisplayDateToDateObject(formatDateToDisplay(user.date_of_birth));
        setDateOfBirth(dobDate || undefined);
      } else {
        setDateOfBirth(undefined);
      }
    } else {
      // Reset form if user is null (e.g. dialog closed and reopened without a user)
      setName('');
      setPhoneNumber('');
      setRole('observer');
      setAssignedStation('');
      setDeploymentParish('');
      setParish('');
      setAddress('');
      setBankName('');
      setBankAccountNumber('');
      setBankRoutingNumber('');
      setTrn('');
      setVerificationStatus('pending');
      setDateOfBirth(undefined);
      setUniqueUserIdDisplay('');
    }
  }, [user, isOpen]);

  // Generic input handler for simple text inputs
  const createInputHandler = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (error) setError(null);
    };

  const handleSelectChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!name.trim()) return 'Full Name is required.';
    if (dateOfBirth && dateOfBirth > new Date()) return 'Date of Birth cannot be in the future.';
    // Validate TRN format if provided (should be 9 digits)
    if (trn && !/^\d{9}$/.test(trn.replace(/\s/g, ''))) {
      return 'TRN must be 9 digits.';
    }
    return null;
  };

  const handleAddressDataChange = (newAddress: string, coordinates?: { lat: number; lng: number }) => {
    setAddress(newAddress);
    if (error) setError(null);
  };

  const handleAddressSelect = (addressData: any) => {
    const newAddress = addressData.address.label;
    const newParish = addressData.address.state;
    setAddress(newAddress);
    if (newParish && JAMAICAN_PARISHES.includes(newParish)) {
        setParish(newParish);
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatePayload = {
        name: name.trim(),
        phone_number: phoneNumber.trim() || undefined,
        role: role,
        assigned_station: assignedStation.trim() || undefined,
        deployment_parish: deploymentParish || undefined,
        parish: parish || undefined,
        address: address.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_account_number: bankAccountNumber.trim() || undefined,
        bank_routing_number: bankRoutingNumber.trim() || undefined,
        trn: trn.replace(/\s/g, '') || undefined,
        verification_status: verificationStatus,
        date_of_birth: dateOfBirth ? formatDateToISO(dateOfBirth) : undefined,
      };

      const { data: updatedUserData, error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'User profile updated successfully.',
      });

      if (updatedUserData) {
        const fullyUpdatedUser: User = {
          id: user.id,
          email: user.email,
          name: updatedUserData.name,
          role: updatedUserData.role as User['role'],
          verificationStatus: updatedUserData.verification_status,
          profileImage: updatedUserData.profile_image,
          phoneNumber: updatedUserData.phone_number,
          assignedStation: updatedUserData.assigned_station,
          deploymentParish: updatedUserData.deployment_parish,
          parish: updatedUserData.parish,
          address: updatedUserData.address,
          bankName: updatedUserData.bank_name,
          bankAccountNumber: updatedUserData.bank_account_number,
          bankRoutingNumber: updatedUserData.bank_routing_number,
          trn: updatedUserData.trn,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          date_of_birth: updatedUserData.date_of_birth,
          unique_user_id: updatedUserData.unique_user_id,
        };
        onUserUpdated(fullyUpdatedUser);
      }
      onClose();

    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={createInputHandler(setName)}
                  disabled={isLoading}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniqueUserId">Unique User ID</Label>
                <Input
                  id="uniqueUserId"
                  type="text"
                  value={uniqueUserIdDisplay}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
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
                  value={phoneNumber}
                  onChange={createInputHandler(setPhoneNumber)}
                  disabled={isLoading}
                  placeholder="+1 876-XXX-XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                 <Select
                    value={role}
                    onValueChange={(value: User['role']) => handleSelectChange(setRole, value)}
                    disabled={isLoading}
                  >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="observer">Observer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="parish_coordinator">Parish Coordinator</SelectItem>
                    <SelectItem value="roving_observer">Roving Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label>Verification Status</Label>
                <Select
                  value={verificationStatus}
                  onValueChange={(value: 'pending' | 'verified' | 'rejected') => handleSelectChange(setVerificationStatus, value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deployment-parish">Deployment Parish</Label>
                <Select
                  value={deploymentParish}
                  onValueChange={(value) => handleSelectChange(setDeploymentParish, value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deployment parish" />
                  </SelectTrigger>
                  <SelectContent>
                    {JAMAICAN_PARISHES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_station">Assigned Station</Label>
                <Input
                  id="assigned_station"
                  value={assignedStation}
                  onChange={createInputHandler(setAssignedStation)}
                  disabled={isLoading}
                  placeholder="Station name or code"
                />
              </div>
            </div>

            <AddressInput
              label="Address"
              value={address}
              onChange={handleAddressDataChange}
              onAddressSelect={handleAddressSelect}
              disabled={isLoading}
              placeholder="Enter full address in Jamaica"
              showCoordinates={false}
            />
          </div>

          {/* Banking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Banking Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankName}
                  onChange={createInputHandler(setBankName)}
                  disabled={isLoading}
                  placeholder="Bank name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={bankAccountNumber}
                  onChange={createInputHandler(setBankAccountNumber)}
                  disabled={isLoading}
                  placeholder="Account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_routing_number">Routing Number</Label>
                <Input
                  id="bank_routing_number"
                  value={bankRoutingNumber}
                  onChange={createInputHandler(setBankRoutingNumber)}
                  disabled={isLoading}
                  placeholder="Routing number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
                <Input
                  id="trn"
                  value={trn}
                  onChange={createInputHandler(setTrn)}
                  disabled={isLoading}
                  placeholder="9-digit TRN"
                  maxLength={9}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
