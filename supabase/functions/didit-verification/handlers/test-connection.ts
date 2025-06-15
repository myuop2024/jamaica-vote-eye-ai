
import { DIDIT_API_KEY, DIDIT_API_BASE_URL, corsHeaders } from '../_shared/config.ts';

export async function handleTestConnection() {
  try {
    if (!DIDIT_API_KEY) throw new Error('DIDIT_API_KEY secret is not set.');

    // Test the connection by trying to access the session endpoint with invalid session ID
    // This should return a 404 but confirms API connectivity and authentication
    const response = await fetch(`${DIDIT_API_BASE_URL}/session/test-connection-check`, {
      headers: { 'X-Api-Key': DIDIT_API_KEY }
    });

    // We expect a 404 for this test, which means the API is responding correctly
    const isConnected = response.status === 404 || response.status === 200;
    
    if (!isConnected && response.status === 401) {
      throw new Error('Invalid API key - authentication failed');
    }
    
    if (!isConnected && response.status === 403) {
      throw new Error('API key lacks required permissions');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        connected: isConnected, 
        message: 'Connection to Didit API successful',
        api_endpoint: DIDIT_API_BASE_URL
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Connection test failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        connected: false, 
        error: error.message,
        api_endpoint: DIDIT_API_BASE_URL
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
}
