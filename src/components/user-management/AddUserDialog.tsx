import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Phone, MapPin, Building, CreditCard, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddressInput } from '@/components/address/AddressInput';
import { JAMAICAN_PARISHES } from '@/services/hereMapsService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format as formatDate, parse as parseDate } from 'date-fns';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
  isOpen,
  onClose,
  onUserAdded
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  const initialFormData = {
    email: '',
    name: '',
    // dateOfBirth will be handled by its own state `dateOfBirth`
    phoneNumber: '',
    role: 'observer' as const,
    assignedStation: '',
    deploymentParish: '',
    parish: '',
    address: '',
    bankName: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    trn: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setFormData(initialFormData);
      setDateOfBirth(undefined);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, address }));
    if (error) setError(null);
  };

  const handleAddressSelect = (addressData: any) => {
    if (addressData.address?.state && JAMAICAN_PARISHES.includes(addressData.address.state)) {
      setFormData((prev) => ({
        ...prev,
        address: addressData.address.label,
        parish: addressData.address.state
      }));
    } else {
      setFormData((prev) => ({ ...prev, address: addressData.address.label }));
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) return 'Email is required.';
    if (!formData.email.includes('@')) return 'Valid email is required.';
    if (!formData.name.trim()) return 'Full Name is required.';
    if (!dateOfBirth) return 'Date of Birth is required.';
    if (dateOfBirth > new Date()) return 'Date of Birth cannot be in the future.';
    
    // Validate TRN format if provided (should be 9 digits)
    if (formData.trn && !/^\d{9}$/.test(formData.trn.replace(/\s/g, ''))) {
      return 'TRN must be 9 digits.';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: Math.random().toString(36).slice(-12), // Temporary password
        options: {
          data: {
            name: formData.name.trim(),
            role: formData.role,
            phone_number: formData.phoneNumber.trim() || null
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with additional information
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            assigned_station: formData.assignedStation.trim() || null,
            deployment_parish: formData.deploymentParish || null,
            parish: formData.parish || null,
            address: formData.address.trim() || null,
            bank_name: formData.bankName.trim() || null,
            bank_account_number: formData.bankAccountNumber.trim() || null,
            bank_routing_number: formData.bankRoutingNumber.trim() || null,
            trn: formData.trn.replace(/\s/g, '') || null
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: 'Success',
        description: 'User created successfully. They will receive an email to set their password.',
      });

      // Reset form
      setFormData({
        email: '',
        name: '',
        phoneNumber: '',
        role: 'observer',
        assignedStation: '',
        deploymentParish: '',
        parish: '',
        address: '',
        bankName: '',
        bankAccountNumber: '',
        bankRoutingNumber: '',
        trn: ''
      });

      if (onUserAdded) onUserAdded();
      onClose();

    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        email: '',
        name: '',
        phoneNumber: '',
        role: 'observer',
        assignedStation: '',
        deploymentParish: '',
        parish: '',
        address: '',
        bankName: '',
        bankAccountNumber: '',
        bankRoutingNumber: '',
        trn: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Add New User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
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
                      {dateOfBirth ? formatDate(dateOfBirth, "dd/MM/yyyy") : <span>Pick a date</span>}
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
                       disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  disabled={isLoading}
                  placeholder="+1 876-XXX-XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="observer">Observer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deployment-parish">Deployment Parish</Label>
                <Select
                  value={formData.deploymentParish}
                  onValueChange={(value) => handleInputChange('deploymentParish', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deployment parish" />
                  </SelectTrigger>
                  <SelectContent>
                    {JAMAICAN_PARISHES.map((parish) => (
                      <SelectItem key={parish} value={parish}>
                        {parish}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedStation">Assigned Station</Label>
                <Input
                  id="assignedStation"
                  value={formData.assignedStation}
                  onChange={(e) => handleInputChange('assignedStation', e.target.value)}
                  disabled={isLoading}
                  placeholder="Station name or code"
                />
              </div>
            </div>

            <AddressInput
              label="Address"
              value={formData.address}
              onChange={handleAddressChange}
              onAddressSelect={handleAddressSelect}
              disabled={isLoading}
              placeholder="Enter full address in Jamaica"
              showCoordinates={false}
            />
          </div>

          {/* Banking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Banking Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  disabled={isLoading}
                  placeholder="Bank name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  disabled={isLoading}
                  placeholder="Account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankRoutingNumber">Routing Number</Label>
                <Input
                  id="bankRoutingNumber"
                  value={formData.bankRoutingNumber}
                  onChange={(e) => handleInputChange('bankRoutingNumber', e.target.value)}
                  disabled={isLoading}
                  placeholder="Routing number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
                <Input
                  id="trn"
                  value={formData.trn}
                  onChange={(e) => handleInputChange('trn', e.target.value)}
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
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
