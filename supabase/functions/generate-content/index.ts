
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

// Helper function to clean and parse JSON from OpenAI response
const parseOpenAIResponse = (content: string) => {
  try {
    // First try to parse as is
    return JSON.parse(content);
  } catch {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        logStep("Failed to parse extracted JSON", { extracted: jsonMatch[1], error: e.message });
        throw new Error("Invalid JSON in code block");
      }
    }
    
    // Try to find JSON-like content without code blocks
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        const extracted = content.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(extracted);
      } catch (e) {
        logStep("Failed to parse extracted JSON without blocks", { extracted: content.substring(jsonStart, jsonEnd + 1), error: e.message });
      }
    }
    
    throw new Error("No valid JSON found in response");
  }
};

// Helper function to generate thumbnail using Runware with enhanced quality
const generateThumbnail = async (thumbnailDesignIdea: string, niche: string, format: string): Promise<string | null> => {
  try {
    const runwareApiKey = Deno.env.get('RUNWARE_API_KEY');
    if (!runwareApiKey) {
      logStep("Runware API key not found");
      return null;
    }

    // Enhanced prompt for better thumbnail generation
    const enhancedPrompt = `PROFESSIONAL YOUTUBE THUMBNAIL: ${thumbnailDesignIdea}. 
    
    STYLE REQUIREMENTS:
    - Ultra-high quality, photorealistic rendering
    - Bold, contrasting colors (bright yellows, electric blues, vibrant reds)
    - Dramatic lighting with strong shadows and highlights
    - Sharp focus with cinematic depth of field
    - Professional studio lighting setup
    - Eye-catching composition optimized for mobile viewing
    
    TEXT OVERLAY:
    - Large, bold, readable typography
    - High contrast text with drop shadows or outlines
    - Positioned for maximum readability on mobile devices
    
    VISUAL ELEMENTS:
    - Professional photography quality
    - Engaging facial expressions (if people are included)
    - Dynamic poses and composition
    - Rich, saturated colors that pop on screen
    - Clean, uncluttered background
    
    NICHE-SPECIFIC: ${niche} content style
    PLATFORM: ${format} optimization
    
    TECHNICAL: 4K resolution, professional grade, commercial quality, trending thumbnail style 2024`;

    logStep("Generating enhanced thumbnail with Runware", { prompt: enhancedPrompt.substring(0, 200) + "..." });

    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          taskType: "authentication",
          apiKey: runwareApiKey,
        },
        {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          positivePrompt: enhancedPrompt,
          negativePrompt: "blurry, low quality, pixelated, amateur, poor lighting, dull colors, text too small, cluttered, unprofessional, watermark, logo, copyright, low resolution, grainy, out of focus, bad composition, ugly, distorted",
          width: 576,
          height: 1024,
          model: "runware:100@1",
          numberResults: 1,
          outputFormat: "WEBP",
          CFGScale: 7.5, // Higher for better prompt following
          scheduler: "FlowMatchEulerDiscreteScheduler",
          steps: 8, // More steps for better quality
          seed: Math.floor(Math.random() * 1000000), // Random seed for variety
        }
      ]),
    });

    if (!response.ok) {
      const errorData = await response.text();
      logStep("Runware API error", { status: response.status, error: errorData });
      return null;
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const imageResult = data.data.find((item: any) => item.taskType === "imageInference");
      if (imageResult && imageResult.imageURL) {
        logStep("Enhanced Runware thumbnail generated successfully", { url: imageResult.imageURL });
        return imageResult.imageURL;
      }
    }
    
    logStep("Runware response missing image data", { data });
    return null;
  } catch (error) {
    logStep("Error generating thumbnail", { error: error.message });
    return null;
  }
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

    const requestData = await req.json();
    const { niche, format, style, videoLength } = requestData;
    logStep("Request data received", { niche, format, style, videoLength });

    // Validate required fields
    if (!niche || !format || !style) {
      logStep("Missing required fields", { niche, format, style, videoLength });
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        message: 'Please provide niche, format, and style'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Enhanced OpenAI prompt for better thumbnail descriptions
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
            content: `You're an expert short-form video creator who specializes in viral Instagram Reels, TikToks, and YouTube Shorts. Your job is to generate a complete content pack for a short video in the selected niche, style, and platform format. The content must be fast-paced, emotional, relatable, and attention-grabbing for viral potential.

IMPORTANT: Respond ONLY with valid JSON. Do not include any markdown, explanations, or code blocks.

Generate content with these specific requirements:

1. **Title** (Under 12 words):
   - Use emotional hooks, curiosity, power words
   - Examples: "I Lost Everything. Then This Happened.", "The Comeback No One Saw Coming"

2. **Description** (Under 2 lines):
   - Must hook the viewer emotionally
   - Add 1-2 relevant emojis
   - End with a CTA like "Watch till the end" or "You won't believe the ending"

3. **Script** (30-60 seconds for ${videoLength}):
   - Start with a viral hook
   - Break into 3 parts: Hook → Problem/Emotion → Resolution/Power Message
   - Use short, punchy, emotional lines
   - Include only what's meant to be spoken on camera (no voiceover instructions)

4. **Hashtags** (6-8 max):
   - Mix trending & niche hashtags
   - Include # symbol with each hashtag

5. **Thumbnail Design Idea** (Professional YouTube thumbnail concept):
   - Create a DETAILED, professional thumbnail concept for maximum click-through rate
   - Focus on VISUAL IMPACT: bright contrasting colors, dramatic lighting, engaging composition
   - Include specific details about: main subject, background, text overlay, color scheme, lighting style
   - Optimize for mobile viewing with bold, readable elements
   - Make it CLICKABLE and eye-catching with professional quality
   - Example: "Split-screen design showing [specific scene] on left in dark, moody lighting, and [contrasting scene] on right in bright, vibrant colors. Large bold text '[SPECIFIC TEXT]' in yellow with black outline, positioned center-top. Professional studio lighting, high contrast, photorealistic quality."

Return as JSON with these exact keys: title, description, script, hashtags, thumbnailDesignIdea

The thumbnailDesignIdea should be extremely detailed and specific for generating high-quality, professional thumbnails.`
          },
          {
            role: 'user',
            content: `Create viral video content for:
Niche: ${niche}
Format: ${format}
Style: ${style}
Video Length: ${videoLength}

Generate content that's fast-paced, emotional, relatable, and attention-grabbing. Focus on viral hooks and emotional engagement.

For the thumbnailDesignIdea, provide an EXTREMELY DETAILED description that includes:
- Specific visual composition and layout
- Exact color schemes and lighting requirements
- Text positioning and styling details
- Professional photography elements
- Platform-specific optimization for ${format}

Return only valid JSON with the required fields.`
          }
        ],
        temperature: 0.8,
        max_tokens: 1200
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      logStep("OpenAI API error", { status: openaiResponse.status, data: errorData });
      return new Response(JSON.stringify({ 
        error: 'OpenAI API error', 
        message: 'Failed to generate content. Please try again.',
        details: errorData 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiData = await openaiResponse.json();
    logStep("OpenAI response received");

    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      logStep("Invalid OpenAI response structure", { data: openaiData });
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI',
        message: 'Failed to generate content. Please try again.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseContent = openaiData.choices[0].message.content;
    logStep("Raw OpenAI content", { content: responseContent });

    let generatedContent;
    try {
      generatedContent = parseOpenAIResponse(responseContent);
      logStep("Content parsed successfully", { generatedContent });
    } catch (parseError) {
      logStep("JSON parse error", { content: responseContent, error: parseError.message });
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        message: 'Content generation failed. Please try again.',
        details: parseError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'script', 'hashtags', 'thumbnailDesignIdea'];
    const missingFields = requiredFields.filter(field => !generatedContent[field]);
    
    if (missingFields.length > 0) {
      logStep("Missing required fields", { missingFields, generatedContent });
      return new Response(JSON.stringify({ 
        error: 'Generated content missing required fields',
        message: 'Content generation incomplete. Please try again.',
        missingFields
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure hashtags is an array and join if needed
    let hashtags = generatedContent.hashtags;
    if (Array.isArray(hashtags)) {
      hashtags = hashtags.join(' ');
    }

    // Convert thumbnailDesignIdea to string if it's an object
    let thumbnailDesignIdea = generatedContent.thumbnailDesignIdea;
    if (typeof thumbnailDesignIdea === 'object') {
      // Convert object to descriptive string
      thumbnailDesignIdea = Object.entries(thumbnailDesignIdea)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }

    // Generate enhanced thumbnail image using Runware
    logStep("Generating enhanced thumbnail image");
    const thumbnailUrl = await generateThumbnail(thumbnailDesignIdea, niche, format);

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
        hashtags: hashtags,
        thumbnail_design_idea: thumbnailDesignIdea,
      })
      .select()
      .single();

    if (saveError) {
      logStep("Content pack save error", { error: saveError });
      return new Response(JSON.stringify({ 
        error: 'Failed to save content pack', 
        message: 'Content generated but failed to save. Please try again.',
        details: saveError 
      }), {
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
      title: generatedContent.title,
      description: generatedContent.description,
      script: generatedContent.script,
      hashtags: hashtags,
      thumbnailDesignIdea: thumbnailDesignIdea,
      thumbnailUrl: thumbnailUrl,
      id: contentPack?.id,
      remainingGenerations: profile.daily_generations_limit - profile.daily_generations_used - 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in generate-content function', { message: errorMessage, stack: error.stack });
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again.',
      type: 'function_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
