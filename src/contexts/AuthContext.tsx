
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // We don't need getSession() because onAuthStateChange fires with an initial session.
    // Making the callback non-async is key to preventing deadlocks.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthProvider: Auth state change', { event: _event, session: !!session });

      if (session?.user) {
        // Not awaiting fetchUserProfile here prevents deadlocks.
        // The state will update once the async operation is done.
        if (session.access_token) {
          localStorage.setItem('jwt', session.access_token);
        }
        fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        localStorage.removeItem('jwt');
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider: Unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    console.log('AuthProvider: Fetching profile for user', userId);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('AuthProvider: Profile fetch result', { profile: !!profile, error });

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If profile doesn't exist, create a basic user object from auth data
        if (error.code === 'PGRST116') {
          console.log('Profile not found - creating basic user object from auth data');
          const basicUser: User = {
            id: userId,
            email: email,
            name: email.split('@')[0], // Use email prefix as temporary name
            role: 'observer' as const,
            verificationStatus: 'pending' as const,
            createdAt: new Date().toISOString()
          };
          
          setUser(basicUser);
          toast({
            title: "Profile Setup Required",
            description: "Please complete your profile setup",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive"
          });
        }
        setIsLoading(false);
        return;
      }

      if (profile) {
        console.log('AuthProvider: Setting user profile', profile);
        const userProfile: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as User['role'],
          verificationStatus: profile.verification_status,
          profileImage: profile.profile_image,
          phoneNumber: profile.phone_number,
          assignedStation: profile.assigned_station,
          parish: profile.parish,
          address: profile.address,
          bankName: profile.bank_name,
          bankAccountNumber: profile.bank_account_number,
          bankRoutingNumber: profile.bank_routing_number,
          trn: profile.trn,
          createdAt: profile.created_at,
          lastLogin: profile.last_login
        };
        
        setUser(userProfile);
        
        // Update last login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive"
      });
    } finally {
      console.log('AuthProvider: Setting loading to false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('AuthProvider: Starting login for', email);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('AuthProvider: Login result', { user: !!data.user, error });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('AuthProvider: Login successful');
        toast({
          title: "Success",
          description: "Login successful"
        });
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: (error as Error).message || "Invalid credentials",
        variant: "destructive"
      });
      setIsLoading(false); // Reset loading state on error
      throw error;
    }
    // Note: Don't set loading to false here, let the auth state change handler do it
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('jwt');
      setUser(null);
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error: unknown) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
