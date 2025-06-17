
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import IdentityVerification from '@/pages/IdentityVerification';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import { GmailCallback } from '@/pages/GmailCallback';
import EncryptionManagement from '@/pages/EncryptionManagement';
import { ChatProvider } from '@/contexts/ChatContext';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        console.log('Query retry attempt:', failureCount, error);
        return failureCount < 3;
      },
    },
  },
});

function App() {
  console.log('App: Rendering main application');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AuthProvider>
            <ChatProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/gmail/callback" element={<GmailCallback />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/identity-verification" 
                  element={
                    <ProtectedRoute>
                      <IdentityVerification />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/encryption" 
                  element={
                    <ProtectedRoute>
                      <EncryptionManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FloatingChatButton />
            </ChatProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
