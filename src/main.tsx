import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import { Toaster } from '@/components/ui/toaster'
import { initializeHereMapsService } from '@/services/hereMapsService'

// Initialize HERE Maps service with environment variable or fallback
const initializeServices = async () => {
  try {
    const apiKey = import.meta.env.VITE_HERE_MAPS_API_KEY;
    if (apiKey) {
      initializeHereMapsService(apiKey);
      console.log('HERE Maps service initialized from environment variable');
    } else {
      console.warn('HERE Maps API key not found in environment variables. Service will be initialized from admin settings.');
    }
  } catch (error) {
    console.warn('Failed to initialize HERE Maps service:', error);
  }
};

// Initialize services before rendering
initializeServices();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ChatProvider>
        <App />
        <Toaster />
      </ChatProvider>
    </AuthProvider>
  </React.StrictMode>,
)
