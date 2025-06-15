
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const GmailCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // This is the user ID
        const error = searchParams.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // Call edge function to exchange code for tokens and save account
        const { data, error: exchangeError } = await supabase.functions.invoke('gmail-oauth-exchange', {
          body: {
            code,
            userId: state,
            redirectUri: `${window.location.origin}/auth/gmail/callback`
          }
        });

        if (exchangeError) {
          throw exchangeError;
        }

        // Notify parent window of success
        if (window.opener) {
          window.opener.postMessage({
            type: 'GMAIL_OAUTH_SUCCESS',
            data
          }, window.location.origin);
        }

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        
        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage({
            type: 'GMAIL_OAUTH_ERROR',
            error: error.message
          }, window.location.origin);
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Connecting Gmail Account...
          </h2>
          <p className="mt-2 text-gray-600">
            Please wait while we set up your Gmail integration.
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
