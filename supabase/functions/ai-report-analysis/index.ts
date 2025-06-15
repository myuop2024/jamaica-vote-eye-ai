
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  reportContent: string;
  reportId: string;
  analysisType: 'sentiment' | 'classification' | 'summary' | 'duplicate_detection';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportContent, reportId, analysisType }: AnalysisRequest = await req.json();
    
    const googleAIKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!googleAIKey) {
      throw new Error('Google AI API key not configured');
    }

    // Construct prompt based on analysis type
    let prompt = '';
    switch (analysisType) {
      case 'sentiment':
        prompt = `Analyze the sentiment of this electoral observation report. Classify as positive, negative, or neutral and provide a confidence score (0-1). Report: "${reportContent}"`;
        break;
      case 'classification':
        prompt = `Classify this electoral observation report into categories: irregularity, normal_process, technical_issue, security_concern, procedural_violation. Report: "${reportContent}"`;
        break;
      case 'summary':
        prompt = `Provide a concise 2-3 sentence summary of this electoral observation report, highlighting key points: "${reportContent}"`;
        break;
      case 'duplicate_detection':
        prompt = `Analyze this report for potential duplicate content or similar incidents. Extract key identifying features like location, time, type of incident: "${reportContent}"`;
        break;
    }

    // Call Google AI Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleAIKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const analysis = result.candidates[0]?.content?.parts[0]?.text;

    if (!analysis) {
      throw new Error('No analysis generated');
    }

    // Store analysis in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('report_analysis')
      .insert({
        report_id: reportId,
        analysis_type: analysisType,
        analysis_result: analysis,
        confidence_score: analysisType === 'sentiment' ? 0.85 : null, // Placeholder
        created_at: new Date().toISOString()
      });

    console.log(`${analysisType} analysis completed for report ${reportId}`);

    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      analysisType,
      reportId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in AI analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
