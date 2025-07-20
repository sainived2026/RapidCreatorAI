
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
    console.log("Admin reset limits function called");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();

    let result;
    
    switch (action) {
      case 'manual_reset_all':
        // Manually reset all users
        const { data: resetResult, error: resetError } = await supabaseClient
          .rpc('manual_reset_all_users');
        
        if (resetError) {
          throw new Error(`Reset error: ${resetError.message}`);
        }
        
        result = { message: resetResult, action: 'manual_reset_all' };
        break;

      case 'check_status':
        // Check current status of daily limits
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('user_id, daily_generations_used, daily_generations_limit, last_reset_date, plan')
          .order('last_reset_date', { ascending: true });

        if (profilesError) {
          throw new Error(`Profiles error: ${profilesError.message}`);
        }

        const today = new Date().toISOString().split('T')[0];
        const needsReset = profiles?.filter(p => 
          !p.last_reset_date || p.last_reset_date < today
        ).length || 0;

        result = {
          totalUsers: profiles?.length || 0,
          usersNeedingReset: needsReset,
          currentDate: today,
          profiles: profiles?.slice(0, 10) // First 10 for preview
        };
        break;

      case 'test_cron':
        // Test the cron job function
        const { data: cronResult, error: cronError } = await supabaseClient
          .rpc('reset_daily_usage');
        
        if (cronError) {
          throw new Error(`Cron test error: ${cronError.message}`);
        }
        
        result = { message: 'Cron job function executed successfully', action: 'test_cron' };
        break;

      default:
        throw new Error('Invalid action. Use: manual_reset_all, check_status, or test_cron');
    }

    console.log("Admin action completed:", action);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Admin function error:', error);
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
