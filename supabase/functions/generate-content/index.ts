
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
        'Hook-based': 'Start with a powerful hook that grabs attention in the first 3 seconds. Use curiosity gaps and compelling questions.',
        'Storytelling': 'Create a narrative structure with beginning, middle, and end. Include emotional elements and relatable characters.',
        'Educational': 'Focus on teaching valuable information. Break down complex topics into digestible steps.',
        'Entertainment': 'Prioritize fun, humor, and engagement. Keep the tone light and entertaining.',
        'Behind-the-scenes': 'Show the process, reveal secrets, and give insider access to how things work.',
        'Tutorial/How-to': 'Provide step-by-step instructions that viewers can follow along with.',
        'Q&A': 'Address common questions and provide clear, helpful answers.',
        'List-based': 'Structure content as a numbered or bulleted list of tips, facts, or items.',
        'Trending/News': 'Connect to current events, trending topics, or viral moments.',
        'Inspirational': 'Motivate and uplift viewers with positive messages and success stories.',
        'Comparison': 'Compare different options, products, or approaches to help viewers decide.',
        'Review': 'Provide honest opinions and evaluations of products, services, or experiences.',
        'Challenge': 'Present challenges, experiments, or tests that create engagement.',
        'Reaction': 'React to trending content, news, or viral videos with authentic responses.',
        'Stats/Facts': 'Present interesting statistics, data, and surprising facts.'
      };
      return stylePrompts[style] || 'Create engaging content that captures attention.';
    };

    const getFormatPrompt = (format: string) => {
      const formatPrompts = {
        'YouTube Short': 'Optimize for YouTube Shorts with vertical format, quick pacing, and strong visual elements.',
        'Instagram Reel': 'Create Instagram-friendly content with trending audio opportunities and hashtag optimization.',
        'TikTok': 'Follow TikTok trends, use popular sounds, and create content that encourages interaction.',
        'Facebook Reel': 'Design for Facebook\'s audience with clear messaging and community engagement focus.',
        'Snapchat Spotlight': 'Create authentic, raw content that feels native to Snapchat\'s platform.',
        'Pinterest Idea Pin': 'Focus on inspiration, tutorials, and visually appealing step-by-step content.',
        'LinkedIn Video': 'Professional tone with business value, industry insights, and career-focused content.',
        'Twitter/X Video': 'Concise, punchy content that sparks conversation and encourages retweets.',
        'Carousel Post': 'Structure content across multiple slides with clear progression and visual consistency.',
        'Story Format': 'Create ephemeral content with interactive elements and behind-the-scenes feel.'
      };
      return formatPrompts[format] || 'Create platform-optimized content.';
    };

    const getScriptLength = (videoLength: string) => {
      const lengthGuides = {
        '15-30 seconds': 'Keep script concise with 30-50 words. Focus on one key message with strong hook and quick payoff.',
        '30-45 seconds': 'Write 50-80 words. Allow for brief setup, main content, and clear call-to-action.',
        'Under 60 seconds': 'Use 80-120 words. Include hook, main content with 2-3 key points, and strong conclusion.'
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

IMPORTANT: You must respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or code blocks. Return only the raw JSON object.

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
            content: `Create viral ${format} content about ${niche} in ${style} style for ${videoLength}. Script must be perfectly timed for ${videoLength}. Respond with only JSON, no other text.`
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
          prompt: `${contentData.thumbnailDesignIdea} for ${niche} ${format} content, vibrant, eye-catching, high quality, 9:16 aspect ratio, ${style} style`,
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
