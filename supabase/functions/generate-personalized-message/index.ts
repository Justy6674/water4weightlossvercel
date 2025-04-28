
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generatePersonalizedMessage(userName: string, milestoneType: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    console.error('Gemini API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate a motivational, friendly hydration reminder for ${userName} who has reached the ${milestoneType} milestone of their daily water intake. Keep it concise, encouraging, and under 100 characters.`
          }]
        }]
      })
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Error generating personalized message:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, milestoneType } = await req.json();
    
    const personalizedMessage = await generatePersonalizedMessage(userName, milestoneType);
    
    return new Response(JSON.stringify({ 
      personalizedMessage: personalizedMessage || 'Keep hydrating, you\'re doing great!' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in personalized message generation:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
