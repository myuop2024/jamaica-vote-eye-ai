
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
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthProvider: Initial session check', { session: !!session, error });
      if (error) {
        console.error('Error getting initial session:', error);
        setIsLoading(false);
        return;
      }
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state change', { event, session: !!session });
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
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
        
        // If profile doesn't exist, that's not necessarily an error for login
        if (error.code === 'PGRST116') {
          console.log('Profile not found - user may need to complete signup');
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
          role: profile.role as 'admin' | 'observer',
          verificationStatus: profile.verification_status,
          profileImage: profile.profile_image,
          phoneNumber: profile.phone_number,
          assignedStation: profile.assigned_station,
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
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
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
      setUser(null);
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error: any) {
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
