
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Edit, MessageCircle } from 'lucide-react';
import { User as UserType } from '@/types/auth';

interface UserDetailsDialogProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: UserType) => void;
  onSendMessage: (user: UserType) => void;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details: {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="flex gap-2">
                <Badge className={`${getRoleBadge(user.role)} border`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Badge className={`${getStatusBadge(user.verificationStatus)} border`}>
                  {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">Email:</span>
                </div>
                <p className="text-sm">{user.email}</p>
              </div>

              {user.phoneNumber && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">Phone:</span>
                  </div>
                  <p className="text-sm">{user.phoneNumber}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Joined:</span>
                </div>
                <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>

              {user.lastLogin && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Last Login:</span>
                  </div>
                  <p className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</p>
                </div>
              )}

              {user.unique_user_id && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium">User ID:</span>
                  </div>
                  <p className="text-sm font-mono">{user.unique_user_id}</p>
                </div>
              )}

              {user.date_of_birth && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Date of Birth:</span>
                  </div>
                  <p className="text-sm">{new Date(user.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.assignedStation && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Assigned Station:</span>
                  </div>
                  <p className="text-sm">{user.assignedStation}</p>
                </div>
              )}

              {user.deploymentParish && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Deployment Parish:</span>
                  </div>
                  <p className="text-sm">{user.deploymentParish}</p>
                </div>
              )}

              {user.parish && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Parish:</span>
                  </div>
                  <p className="text-sm">{user.parish}</p>
                </div>
              )}

              {user.address && (
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Address:</span>
                  </div>
                  <p className="text-sm">{user.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Banking Information */}
          {(user.bankName || user.bankAccountNumber || user.bankRoutingNumber || user.trn) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Banking Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.bankName && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CreditCard className="w-4 h-4" />
                        <span className="font-medium">Bank Name:</span>
                      </div>
                      <p className="text-sm">{user.bankName}</p>
                    </div>
                  )}

                  {user.bankAccountNumber && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CreditCard className="w-4 h-4" />
                        <span className="font-medium">Account Number:</span>
                      </div>
                      <p className="text-sm font-mono">****{user.bankAccountNumber.slice(-4)}</p>
                    </div>
                  )}

                  {user.bankRoutingNumber && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CreditCard className="w-4 h-4" />
                        <span className="font-medium">Routing Number:</span>
                      </div>
                      <p className="text-sm font-mono">{user.bankRoutingNumber}</p>
                    </div>
                  )}

                  {user.trn && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CreditCard className="w-4 h-4" />
                        <span className="font-medium">TRN:</span>
                      </div>
                      <p className="text-sm font-mono">{user.trn}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onSendMessage(user)}
            className="text-blue-600"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Send Message
          </Button>
          <Button
            onClick={() => onEdit(user)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
