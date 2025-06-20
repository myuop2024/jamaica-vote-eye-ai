import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Shield,
  MessageSquare,
  CreditCard,
  Building,
  Hash
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  phone_number?: string;
  assigned_station?: string;
  deploymentParish?: string;
  parish?: string;
  address?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  trn?: string;
  created_at: string;
  last_login?: string;
}

interface UserDetailsDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: UserProfile) => void;
  onSendMessage: (user: UserProfile) => void;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  onSendMessage
}) => {
  if (!user) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      verified: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const maskBankAccount = (accountNumber?: string) => {
    if (!accountNumber) return null;
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <div className="flex gap-2">
                <Badge className={`${getRoleBadge(user.role)} border`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Badge className={`${getStatusBadge(user.verification_status)} border`}>
                  {user.verification_status.charAt(0).toUpperCase() + user.verification_status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onSendMessage(user)}>
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                <Shield className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm break-all">{user.email}</p>
                  </div>
                </div>

                {user.phone_number && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm">{user.phone_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Details
              </h4>
              
              <div className="space-y-3">
                {user.deploymentParish && (
                  <div className="grid grid-cols-3 gap-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-500">Deployment Parish</p>
                    <p className="text-sm col-span-2">{user.deploymentParish}</p>
                  </div>
                )}

                {user.parish && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Parish</p>
                      <p className="text-sm">{user.parish}</p>
                    </div>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-sm">{user.address}</p>
                    </div>
                  </div>
                )}

                {user.assigned_station && (
                  <div className="flex items-start gap-3">
                    <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned Station</p>
                      <p className="text-sm">{user.assigned_station}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Account Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Joined</p>
                    <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {user.last_login && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Login</p>
                      <p className="text-sm">{new Date(user.last_login).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {user.trn && (
                  <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">TRN</p>
                      <p className="text-sm font-mono">{user.trn}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banking Information Section */}
          {(user.bank_name || user.bank_account_number || user.bank_routing_number) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Banking Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {user.bank_name && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Bank Name</p>
                        <p className="text-sm">{user.bank_name}</p>
                      </div>
                    </div>
                  )}

                  {user.bank_account_number && (
                    <div className="flex items-start gap-3">
                      <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Account Number</p>
                        <p className="text-sm font-mono">{maskBankAccount(user.bank_account_number)}</p>
                      </div>
                    </div>
                  )}

                  {user.bank_routing_number && (
                    <div className="flex items-start gap-3">
                      <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Routing Number</p>
                        <p className="text-sm font-mono">{user.bank_routing_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Recent Activity</h4>
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
              <p>Activity tracking will be implemented in the next phase.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
