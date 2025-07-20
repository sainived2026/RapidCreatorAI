
-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Fix the existing reset_daily_usage function to use correct column names
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET daily_generations_used = 0,
      last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$function$;

-- Create a comprehensive function to reset all users
CREATE OR REPLACE FUNCTION public.reset_daily_usage_for_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset all users regardless of their last reset date
  UPDATE public.profiles
  SET daily_generations_used = 0,
      last_reset_date = CURRENT_DATE;
  
  -- Log the reset operation
  RAISE NOTICE 'Daily usage reset completed for all users at %', NOW();
END;
$function$;

-- Create a function to check and reset individual user if needed
CREATE OR REPLACE FUNCTION public.check_and_reset_user_daily_usage(user_uuid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  needs_reset boolean := false;
BEGIN
  -- Check if user needs reset and update if necessary
  UPDATE public.profiles
  SET daily_generations_used = 0,
      last_reset_date = CURRENT_DATE,
      needs_reset = true
  WHERE user_id = user_uuid 
    AND (last_reset_date < CURRENT_DATE OR last_reset_date IS NULL)
  RETURNING true INTO needs_reset;
  
  RETURN COALESCE(needs_reset, false);
END;
$function$;

-- Set up cron job to reset daily usage every day at midnight UTC
SELECT cron.schedule(
  'reset-daily-usage',
  '0 0 * * *',
  'SELECT public.reset_daily_usage();'
);

-- Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION public.manual_reset_all_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reset_count integer;
BEGIN
  -- Count users that will be reset
  SELECT COUNT(*) INTO reset_count
  FROM public.profiles
  WHERE last_reset_date < CURRENT_DATE OR last_reset_date IS NULL;
  
  -- Perform the reset
  PERFORM public.reset_daily_usage_for_all_users();
  
  RETURN format('Reset completed for %s users at %s', reset_count, NOW());
END;
$function$;
