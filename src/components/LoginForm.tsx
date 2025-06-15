
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (user && !isLoading) {
      console.log('LoginForm: User is logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    console.log('LoginForm: Attempting login for', email);

    try {
      await login(email, password);
      console.log('LoginForm: Login call completed successfully');
      // Don't navigate here - let the useEffect handle it when user state updates
    } catch (err: any) {
      console.error('LoginForm: Login failed', err);
      setError(err.message);
    } finally {
      // Always reset the submitting state
      setIsSubmitting(false);
    }
  };

  // Show loading state while auth is initializing but not while submitting
  const showLoadingState = isLoading && !isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-black/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-700 to-black bg-clip-text text-transparent">
              Jamaica Electoral CRM
            </CardTitle>
            <CardDescription className="text-gray-600">
              Secure Electoral Observation Platform
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900">Test Admin Credentials:</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Email:</strong> admin@electoral.gov.jm</p>
              <p><strong>Password:</strong> Use the password you set during signup</p>
              <p className="text-xs">Create this account using the signup form if it doesn't exist yet.</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={showLoadingState || isSubmitting}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={showLoadingState || isSubmitting}
                  className="h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={showLoadingState || isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={showLoadingState || isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing In...
                </div>
              ) : showLoadingState ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                disabled={showLoadingState || isSubmitting}
                className="text-sm text-green-600 hover:text-green-800 underline disabled:opacity-50"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
