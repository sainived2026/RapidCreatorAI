
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-CONTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    logStep("Supabase client created");

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      logStep("Authentication failed - no user");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("User authenticated", { userId: user.id });

    const { niche, format, style, videoLength } = await req.json();
    logStep("Request data received", { niche, format, style, videoLength });

    // Check user's daily limit
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      logStep("Profile fetch error", { error: profileError });
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Profile fetched", { plan: profile.plan, used: profile.daily_generations_used, limit: profile.daily_generations_limit });

    // Check if user has exceeded daily limit
    if (profile.daily_generations_used >= profile.daily_generations_limit) {
      logStep("Daily limit exceeded");
      return new Response(JSON.stringify({ 
        error: 'Daily limit reached',
        message: '🚫 Daily limit reached. Upgrade to Pro to generate more.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      logStep("OpenAI API key missing");
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Calling OpenAI API");

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert video content strategist. Based on the user's niche, format, and style, generate:

- 1 Viral Video Title (catchy and clickable)
- 1 Description (max 200 characters, engaging)
- 1 Script (under 100 words, ${videoLength})
- 4 Hashtags (relevant to niche and trending)
- 1 Thumbnail Text Line (short, impactful)
- 1 Thumbnail Design Idea (detailed visual description)

Format your response as JSON with keys: title, description, script, hashtags, thumbnailText, thumbnailDesignIdea`
          },
          {
            role: 'user',
            content: `Niche: ${niche}\nFormat: ${format}\nStyle: ${style}\nVideo Length: ${videoLength}`
          }
        ],
        temperature: 0.8
      }),
    });

    const openaiData = await openaiResponse.json();
    
    if (!openaiResponse.ok) {
      logStep("OpenAI API error", { status: openaiResponse.status, data: openaiData });
      return new Response(JSON.stringify({ error: 'OpenAI API error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("OpenAI response received");

    let generatedContent;
    try {
      generatedContent = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      logStep("JSON parse error", { content: openaiData.choices[0].message.content });
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Content generated successfully");

    // Save content pack to database
    const { data: contentPack, error: saveError } = await supabaseClient
      .from('content_packs')
      .insert({
        user_id: user.id,
        niche,
        format,
        style,
        video_length: videoLength,
        title: generatedContent.title,
        description: generatedContent.description,
        script: generatedContent.script,
        hashtags: generatedContent.hashtags,
        thumbnail_text: generatedContent.thumbnailText,
        thumbnail_design_idea: generatedContent.thumbnailDesignIdea,
      })
      .select()
      .single();

    if (saveError) {
      logStep("Content pack save error", { error: saveError });
      return new Response(JSON.stringify({ error: 'Failed to save content pack' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user's daily usage
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        daily_generations_used: profile.daily_generations_used + 1,
        last_reset_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', user.id);

    if (updateError) {
      logStep("Usage update error", { error: updateError });
    }

    logStep("Function completed successfully");

    return new Response(JSON.stringify({
      ...generatedContent,
      id: contentPack?.id,
      remainingGenerations: profile.daily_generations_limit - profile.daily_generations_used - 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in generate-content function', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
