
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Generate content function called");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('User not authenticated');
    }

    console.log("User authenticated:", user.id);

    // Check and reset user daily usage if needed
    const { data: resetResult, error: resetError } = await supabaseClient
      .rpc('check_and_reset_user_daily_usage', { user_uuid: user.id });

    if (resetError) {
      console.error('Reset check error:', resetError);
    } else if (resetResult) {
      console.log('User daily usage was reset');
    }

    // Get user profile with current limits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      throw new Error('User profile not found');
    }

    console.log("User profile:", profile);

    // Check if user has exceeded daily limit
    if (profile.daily_generations_used >= profile.daily_generations_limit) {
      return new Response(
        JSON.stringify({
          error: 'Daily generation limit exceeded',
          message: `You have reached your daily limit of ${profile.daily_generations_limit} generations. Your limit will reset at midnight UTC.`,
          limit: profile.daily_generations_limit,
          used: profile.daily_generations_used
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get request body
    const { niche, format, style, videoLength } = await req.json();

    if (!niche || !format || !style) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log("Generating content for:", { niche, format, style, videoLength });

    // Generate content using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a viral content creator expert. Generate engaging ${format} content for the ${niche} niche in a ${style} style. The content should be optimized for ${videoLength} videos.

            Please provide:
            1. A catchy title (max 60 characters)
            2. A compelling description (max 200 characters) 
            3. A detailed script with hooks, main content, and call-to-action
            4. Relevant hashtags (mix of popular and niche-specific)
            5. A thumbnail design concept description

            Format your response as JSON with these exact keys:
            - title
            - description  
            - script
            - hashtags
            - thumbnailDesignIdea`
          },
          {
            role: 'user',
            content: `Create viral ${format} content about ${niche} in ${style} style for ${videoLength}.`
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI response received");

    let contentData;
    try {
      contentData = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response format from AI');
    }

    // Generate thumbnail using Runware API
    let thumbnailUrl = null;
    try {
      const runwareResponse = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RUNWARE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          prompt: `${contentData.thumbnailDesignIdea} for ${niche} content, vibrant, eye-catching, high quality, 9:16 aspect ratio`,
          width: 512,
          height: 910,
          model: "runware:100@1",
          steps: 4,
          CFGScale: 1,
        }]),
      });

      if (runwareResponse.ok) {
        const runwareData = await runwareResponse.json();
        if (runwareData.data && runwareData.data[0] && runwareData.data[0].imageURL) {
          thumbnailUrl = runwareData.data[0].imageURL;
          console.log("Thumbnail generated successfully");
        }
      } else {
        console.warn('Thumbnail generation failed, continuing without image');
      }
    } catch (thumbnailError) {
      console.warn('Thumbnail generation error:', thumbnailError);
    }

    // Save content pack to database
    const { data: contentPack, error: saveError } = await supabaseClient
      .from('content_packs')
      .insert({
        user_id: user.id,
        niche,
        format,
        style,
        video_length: videoLength,
        title: contentData.title,
        description: contentData.description,
        script: contentData.script,
        hashtags: contentData.hashtags,
        thumbnail_design_idea: contentData.thumbnailDesignIdea,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      throw new Error('Failed to save content pack');
    }

    // Update user's daily generation count
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        daily_generations_used: profile.daily_generations_used + 1
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      // Don't throw here as content was already generated
    }

    console.log("Content generation completed successfully");

    // Return the generated content
    return new Response(
      JSON.stringify({
        ...contentData,
        thumbnailUrl,
        id: contentPack.id,
        remaining: profile.daily_generations_limit - profile.daily_generations_used - 1
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
