
-- First, let's ensure we have the pg_cron extension enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to reset daily usage for all users
CREATE OR REPLACE FUNCTION public.reset_daily_usage_for_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset daily_generations_used to 0 for all users where last_reset_date is before today
  UPDATE public.profiles 
  SET 
    daily_generations_used = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
  
  -- Log the number of users reset
  RAISE NOTICE 'Daily usage reset completed for users with last_reset_date < %', CURRENT_DATE;
END;
$$;

-- Create a cron job to run the reset function every day at midnight UTC
-- This will reset daily usage for all eligible users
SELECT cron.schedule(
  'reset-daily-usage',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT public.reset_daily_usage_for_all_users();
  $$
);

-- Update the existing trigger function to be more robust
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the last reset date is before today and reset if needed
  IF NEW.last_reset_date IS NULL OR NEW.last_reset_date < CURRENT_DATE THEN
    NEW.daily_generations_used = 0;
    NEW.last_reset_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists (recreate it to be safe)
DROP TRIGGER IF EXISTS reset_daily_usage_trigger ON public.profiles;
CREATE TRIGGER reset_daily_usage_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.reset_daily_usage();

-- Also ensure new users get the correct reset date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, plan, daily_generations_limit, daily_generations_used, last_reset_date)
  VALUES (
    NEW.id, 
    NEW.email, 
    'free', 
    4,  -- Free plan limit
    0, 
    CURRENT_DATE  -- Set to current date for new users
  );
  RETURN NEW;
END;
$function$;
