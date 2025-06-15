
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VerificationPromptProps {
  onClose: () => void;
}

export const VerificationPrompt: React.FC<VerificationPromptProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartVerification = () => {
    navigate('/identity-verification');
    onClose();
  };

  const handleRemindLater = () => {
    toast({
      title: "Reminder Set",
      description: "We'll remind you about verification later",
    });
    onClose();
  };

  const getVerificationStatusBadge = () => {
    if (!user) return null;
    
    switch (user.verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300">
            Not Verified
          </Badge>
        );
    }
  };

  // Don't show prompt if user is already verified
  if (user?.verificationStatus === 'verified') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Identity Verification Required</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">Current Status:</span>
                {getVerificationStatusBadge()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-sm">
            To ensure the integrity of our electoral observation process, all observers must complete 
            identity verification. This helps maintain trust and credibility in our reporting system.
          </CardDescription>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What you'll need:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Government-issued photo ID</li>
              <li>• 2-3 minutes of your time</li>
              <li>• Good lighting for document photos</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartVerification}
              disabled={isStarting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              Verify Now
            </Button>
            <Button
              variant="outline"
              onClick={handleRemindLater}
              className="flex-1"
            >
              Remind Later
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your personal information is processed securely and in compliance with privacy regulations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
