import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddressInput } from '@/components/address/AddressInput';
import { JAMAICAN_PARISHES } from '@/services/hereMapsService';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  phone_number?: string;
  assigned_station?: string;
  parish?: string;
  address?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  trn?: string;
  created_at: string;
  last_login?: string;
}

interface UserEditDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (userId: string, status: 'pending' | 'verified' | 'rejected') => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    verification_status: 'pending' as 'pending' | 'verified' | 'rejected',
    phone_number: '',
    assigned_station: '',
    parish: '',
    address: '',
    bank_name: '',
    bank_account_number: '',
    bank_routing_number: '',
    trn: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        verification_status: user.verification_status,
        phone_number: user.phone_number || '',
        assigned_station: user.assigned_station || '',
        parish: user.parish || '',
        address: user.address || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_routing_number: user.bank_routing_number || '',
        trn: user.trn || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    // Validate TRN format if provided (should be 9 digits)
    if (formData.trn && !/^\d{9}$/.test(formData.trn.replace(/\s/g, ''))) {
      return 'TRN must be 9 digits';
    }
    return null;
  };

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, address }));
    if (error) setError(null);
  };

  const handleAddressSelect = (addressData: any) => {
    // Auto-fill parish if it can be determined from the address
    if (addressData.address?.state && JAMAICAN_PARISHES.includes(addressData.address.state)) {
      setFormData(prev => ({ 
        ...prev, 
        address: addressData.address.label,
        parish: addressData.address.state 
      }));
    } else {
      setFormData(prev => ({ ...prev, address: addressData.address.label }));
    }
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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: formData.verification_status,
          phone_number: formData.phone_number.trim() || null,
          assigned_station: formData.assigned_station.trim() || null,
          parish: formData.parish || null,
          address: formData.address.trim() || null,
          bank_name: formData.bank_name.trim() || null,
          bank_account_number: formData.bank_account_number.trim() || null,
          bank_routing_number: formData.bank_routing_number.trim() || null,
          trn: formData.trn.replace(/\s/g, '') || null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'User profile updated successfully.',
      });

      onUpdateStatus(user.id, formData.verification_status);
      onClose();

    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
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
                <Label>Verification Status</Label>
                <Select
                  value={formData.verification_status}
                  onValueChange={(value) => handleInputChange('verification_status', value)}
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

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  disabled={isLoading}
                  placeholder="+1 876-XXX-XXXX"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parish">Parish</Label>
                <Select
                  value={formData.parish}
                  onValueChange={(value) => handleInputChange('parish', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parish" />
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
                <Label htmlFor="assigned_station">Assigned Station</Label>
                <Input
                  id="assigned_station"
                  value={formData.assigned_station}
                  onChange={(e) => handleInputChange('assigned_station', e.target.value)}
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
            <h3 className="text-lg font-semibold">Banking Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  disabled={isLoading}
                  placeholder="Bank name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                  disabled={isLoading}
                  placeholder="Account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_routing_number">Routing Number</Label>
                <Input
                  id="bank_routing_number"
                  value={formData.bank_routing_number}
                  onChange={(e) => handleInputChange('bank_routing_number', e.target.value)}
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
