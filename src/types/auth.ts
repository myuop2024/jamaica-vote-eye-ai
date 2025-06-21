
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'observer' | 'parish_coordinator' | 'roving_observer';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  profileImage?: string;
  phoneNumber?: string;
  assignedStation?: string;
  deploymentParish?: string;
  parish?: string;
  address?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  trn?: string;
  createdAt: string;
  lastLogin?: string;
  // New fields
  date_of_birth?: string; // Stored as YYYY-MM-DD string from Supabase
  unique_user_id?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>; // Added refresh function
}
