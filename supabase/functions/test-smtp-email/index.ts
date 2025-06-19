import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { SmtpClient } from "https://deno.land/x/smtp@v0.10.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the current user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization header');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) throw new Error('Could not authenticate user');

    // Get admin's email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();
    if (profileError || !profile?.email) throw new Error('Could not find user email');

    // Parse request body for test config
    let testConfig = null;
    try {
      testConfig = await req.json();
    } catch (_) {}

    let config: Record<string, any>;
    if (testConfig && testConfig.smtpHost && testConfig.smtpPort && testConfig.smtpUsername && testConfig.smtpPassword) {
      config = {
        COMM_SMTP_HOST: testConfig.smtpHost,
        COMM_SMTP_PORT: testConfig.smtpPort,
        COMM_SMTP_USERNAME: testConfig.smtpUsername,
        COMM_SMTP_PASSWORD: testConfig.smtpPassword,
        COMM_SMTP_TLS: testConfig.smtpTls !== undefined ? testConfig.smtpTls : true,
      };
    } else {
      // Get SMTP settings from DB
      const { data: configData, error: configError } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'COMM_SMTP_HOST',
          'COMM_SMTP_PORT',
          'COMM_SMTP_USERNAME',
          'COMM_SMTP_PASSWORD',
          'COMM_SMTP_TLS',
          'COMM_EMAIL_PROVIDER',
          'COMM_EMAIL_ENABLED'
        ]);
      if (configError) throw new Error('Could not load SMTP config');
      config = configData.reduce((acc, item) => {
        let value = item.setting_value;
        if (typeof value === 'object' && value !== null && 'value' in value) value = value.value;
        acc[item.setting_key] = value;
        return acc;
      }, {} as Record<string, any>);
      if (!config.COMM_EMAIL_ENABLED || config.COMM_EMAIL_PROVIDER !== 'smtp') {
        throw new Error('SMTP is not enabled as the email provider');
      }
    }

    // Prepare SMTP client
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: config.COMM_SMTP_HOST,
      port: Number(config.COMM_SMTP_PORT),
      username: config.COMM_SMTP_USERNAME,
      password: config.COMM_SMTP_PASSWORD,
    });
    // Send test email
    await client.send({
      from: config.COMM_SMTP_USERNAME,
      to: profile.email,
      subject: "Test Email from Jamaica Vote Eye AI",
      content: "This is a test email to confirm your SMTP settings are working.",
    });
    await client.close();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler); 