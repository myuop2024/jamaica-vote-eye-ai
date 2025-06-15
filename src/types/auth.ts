export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'observer' | 'roving_observer' | 'parish_coordinator';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  profileImage?: string;
  phoneNumber?: string;
  assignedStation?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
