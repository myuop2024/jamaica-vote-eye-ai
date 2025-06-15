
import { DIDIT_API_KEY, DIDIT_API_BASE_URL, corsHeaders } from '../_shared/config.ts';

export async function handleTestConnection() {
  try {
    if (!DIDIT_API_KEY) throw new Error('DIDIT_API_KEY secret is not set.');

    const response = await fetch(`${DIDIT_API_BASE_URL}/status`, {
      headers: { 'Authorization': `Bearer ${DIDIT_API_KEY}` }
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Didit API returned status: ${response.status}. Body: ${errorBody}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, connected: data.status === 'ok', message: 'Connection to didit API successful' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Connection test failed:', error);
    return new Response(
      JSON.stringify({ success: false, connected: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
}
