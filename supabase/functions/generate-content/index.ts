
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

    if (!niche || !format || !style || !videoLength) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log("Generating content for:", { niche, format, style, videoLength });

    // Create dynamic prompts based on style and format
    const getStylePrompt = (style: string) => {
      const stylePrompts = {
     'Hook-based': 'Grab attention in the first 3 seconds with bold hooks, curiosity gaps, or questions.',
     'Storytelling': 'Craft a clear beginning, middle, and end. Use emotion, tension, and relatable characters.',
     'Educational': 'Teach something valuable. Break down complex topics into simple, step-by-step lessons.',
     'Entertainment': 'Engage with humor, surprise, or fun edits. Keep it light, fast-paced, and enjoyable.',
     'Behind-the-scenes': 'Reveal the \'how\' behind the final result. Show raw, real, and relatable processes.',
     'Tutorial / How-to': 'Provide practical, step-by-step guidance viewers can follow and apply instantly.',
     'Q&A': 'Answer common or trending questions in a clear, helpful, and engaging format.',
     'List-based': 'Deliver fast, snappy tips or facts using numbered or bulleted lists to keep attention.',
     'Trending / News': 'Tap into trending topics or current events to stay relevant and ride the algorithm.',
     'Inspirational': 'Share motivational insights or success stories that spark emotion and positivity.',
     'Comparison': 'Compare products, methods, or ideas side-by-side to help viewers choose smarter.',
     'Review': 'Give honest, personal reviews of tools, services, or experiences with pros and cons.',
     'Challenge': 'Test limits or do viral challenges that spark curiosity and boost engagement.',
     'Reaction': 'React to viral videos, news, or memes with authentic, entertaining commentary.',
     'Stats / Facts': 'Share surprising data or mind-blowing facts in a concise, punchy way.'
      };
      return stylePrompts[style] || 'Create engaging content that captures attention.';
    };

    const getFormatPrompt = (format: string) => {
      const formatPrompts = {
        'YouTube Short': 'Vertical, fast-paced videos with strong hooks, edits, and visual storytelling.',
        'Instagram Reel': 'Use trending audio, clean visuals, and hashtags for shareable, scroll-stopping content.',
        'TikTok': 'Leverage trends, viral sounds, and relatable formats that invite duets and comments.',
        'Facebook Reel': 'Keep messaging clear and friendly with a focus on shareability and reactions.',
        'Snapchat Spotlight': 'Raw, native-style clips that feel personal, spontaneous, and unpolished.',
        'Pinterest Idea Pin': 'Inspire with how-tos, DIYs, and beautiful, step-by-step visual content.',
        'LinkedIn Video': 'Keep it professional with insights, tips, and value-driven business storytelling.',
        'Twitter/X Video': 'Short, bold content that sparks discussion and stands out in the feed.',
        'Carousel Post': 'Deliver multi-part value across slides with visual harmony and clear flow.',
        'Story Format': 'Create behind-the-scenes, time-sensitive content with polls, Q&As, or swipe-ups.'
      };
      return formatPrompts[format] || 'Create platform-optimized content.';
    };

    const getScriptLength = (videoLength: string) => {
      const lengthGuides = {
        '15-30 seconds': 'Keep script concise with 50-70 words. Focus on one key message with strong hook and quick payoff.',
        '30-45 seconds': 'Write 70-100 words. Allow for brief setup, main content, and clear call-to-action.',
        'Under 60 seconds': 'Use 100-140 words. Include hook, main content with 2-3 key points, and strong conclusion.'
      };
      return lengthGuides[videoLength] || 'Keep script appropriate for video length.';
    };

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
            content: `You are a viral content creator expert specializing in ${format} content for the ${niche} niche. 

STYLE GUIDANCE: ${getStylePrompt(style)}

FORMAT GUIDANCE: ${getFormatPrompt(format)}

SCRIPT LENGTH: ${getScriptLength(videoLength)} The video length is ${videoLength}.

Create content that:
- Hooks viewers in the first 3 seconds
- Maintains engagement throughout
- Includes clear value proposition
- Ends with strong call-to-action
- Uses platform-specific best practices
- Incorporates trending elements when relevant

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks, no additional text. Just pure JSON.

Required JSON format:
{
  "title": "max 60 characters",
  "description": "max 200 characters",
  "script": "optimized for ${videoLength} with proper pacing",
  "hashtags": ["array", "of", "15-25", "hashtags"],
  "thumbnailDesignIdea": "description for ${format}"
}`
          },
          {
            role: 'user',
            content: `Create viral ${format} content about ${niche} in ${style} style for ${videoLength}. Script must be perfectly timed for ${videoLength}. Return ONLY JSON, absolutely no other text or formatting.`
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
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
      let responseText = openaiData.choices[0].message.content;
      console.log("Raw OpenAI response:", responseText);
      
      // More comprehensive cleaning of markdown and formatting
      responseText = responseText.trim();
      
      // Remove markdown code blocks
      responseText = responseText.replace(/```json\s*/gi, '');
      responseText = responseText.replace(/```\s*/g, '');
      
      // Remove any leading/trailing non-JSON text
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        responseText = responseText.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log("Cleaned response text:", responseText);
      contentData = JSON.parse(responseText);
      
      // Validate required fields
      if (!contentData.title || !contentData.description || !contentData.script || !contentData.hashtags || !contentData.thumbnailDesignIdea) {
        throw new Error('Missing required fields in AI response');
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw response:', openaiData.choices[0].message.content);
      
      // Return a more detailed error response
      return new Response(
        JSON.stringify({
          error: 'Invalid AI response format',
          message: 'The AI returned an invalid response. Please try again.',
          details: parseError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate thumbnail using Runware API with correct dimensions
    let thumbnailUrl = null;
    try {
      console.log("Starting thumbnail generation...");
      
      const runwareApiKey = Deno.env.get('RUNWARE_API_KEY');
      if (!runwareApiKey) {
        console.warn('RUNWARE_API_KEY not found, skipping thumbnail generation');
      } else {
        const runwareResponse = await fetch('https://api.runware.ai/v1', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${runwareApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            {
              taskType: "authentication",
              apiKey: runwareApiKey
            },
            {
              taskType: "imageInference",
              taskUUID: crypto.randomUUID(),
              positivePrompt: `${contentData.thumbnailDesignIdea} for ${niche} ${format} content, vibrant, eye-catching, high quality, 9:16 aspect ratio, ${style} style`,
              width: 512,
              height: 896, // Changed to 896 (multiple of 64) for 9:16 aspect ratio
              model: "runware:100@1",
              steps: 4,
              CFGScale: 1,
              numberResults: 1,
              outputFormat: "WEBP"
            }
          ]),
        });

        console.log("Runware API response status:", runwareResponse.status);
        
        if (runwareResponse.ok) {
          const runwareData = await runwareResponse.json();
          console.log("Runware API response:", runwareData);
          
          if (runwareData.data) {
            // Find the image inference result
            const imageResult = runwareData.data.find(item => item.taskType === "imageInference");
            if (imageResult && imageResult.imageURL) {
              thumbnailUrl = imageResult.imageURL;
              console.log("Thumbnail generated successfully:", thumbnailUrl);
            } else {
              console.warn('No image URL in Runware response');
            }
          } else {
            console.warn('No data in Runware response');
          }
        } else {
          const errorText = await runwareResponse.text();
          console.error('Runware API error:', errorText);
        }
      }
    } catch (thumbnailError) {
      console.error('Thumbnail generation error:', thumbnailError);
    }

    // Convert hashtags array to string for database storage
    const hashtagsString = Array.isArray(contentData.hashtags) 
      ? contentData.hashtags.join(' ') 
      : contentData.hashtags;

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
        hashtags: hashtagsString,
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
