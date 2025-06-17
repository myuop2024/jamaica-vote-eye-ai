import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, MapPin, FileText, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddressInput } from '@/components/address/AddressInput';
import { JAMAICAN_PARISHES } from '@/services/hereMapsService';

export const IdentityVerificationForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    deploymentParish: '',
    parish: '',
    phoneNumber: '',
    idType: 'national_id' as const,
    idNumber: '',
    bankName: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    trn: ''
  });

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
    if (!formData.deploymentParish) return 'Deployment Parish is required';
    if (!formData.phoneNumber.trim()) return 'Phone number is required';
    if (!formData.parish) return 'Parish is required';
    if (!formData.address.trim()) return 'Address is required';
    
    // Validate TRN format if provided (should be 9 digits)
    if (formData.trn && !/^\d{9}$/.test(formData.trn.replace(/\s/g, ''))) {
      return 'TRN must be 9 digits';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not found');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const verificationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        deployment_parish: formData.deploymentParish,
        parish: formData.parish,
        phone_number: formData.phoneNumber,
        id_type: formData.idType,
        id_number: formData.idNumber,
        bank_name: formData.bankName.trim() || null,
        bank_account_number: formData.bankAccountNumber.trim() || null,
        bank_routing_number: formData.bankRoutingNumber.trim() || null,
        trn: formData.trn.replace(/\s/g, '') || null,
        verification_status: 'pending'
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(verificationData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Information Submitted',
        description: 'Your information has been submitted for verification. You will be notified when the verification is complete.',
      });

      // Reset form
      resetForm();

    } catch (error: any) {
      console.error('Error submitting verification:', error);
      setError(error.message || 'Failed to submit verification information');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      address: '',
      deploymentParish: '',
      parish: '',
      phoneNumber: '',
      idType: 'national_id',
      idNumber: '',
      bankName: '',
      bankAccountNumber: '',
      bankRoutingNumber: '',
      trn: ''
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Identity Verification
        </CardTitle>
        <CardDescription>
          Please provide your information for identity verification. All information will be kept secure and confidential.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={isLoading}
                placeholder="+1 876-XXX-XXXX"
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="deployment-parish">Deployment Parish *</Label>
              <Select
                value={formData.deploymentParish}
                onValueChange={(value) => handleInputChange('deploymentParish', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your deployment parish" />
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

            <AddressInput
              label="Address *"
              value={formData.address}
              onChange={handleAddressChange}
              onAddressSelect={handleAddressSelect}
              disabled={isLoading}
              placeholder="Enter your full address in Jamaica"
              required={true}
              showCoordinates={false}
            />
          </div>

          {/* Banking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Banking Information (Optional)
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

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
