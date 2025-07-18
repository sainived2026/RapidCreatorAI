
-- Update the daily generation limits for existing profiles
UPDATE public.profiles 
SET daily_generations_limit = CASE 
  WHEN plan = 'free' THEN 4
  WHEN plan = 'pro' THEN 10
  ELSE daily_generations_limit
END;

-- Update the handle_new_user function to set the new limits for new users
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
    4,  -- Updated from 2 to 4 for free plan
    0, 
    CURRENT_DATE
  );
  RETURN NEW;
END;
$function$;
