
-- Fix the check_and_reset_user_daily_usage function to remove reference to non-existent column
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
      last_reset_date = CURRENT_DATE
  WHERE user_id = user_uuid 
    AND (last_reset_date < CURRENT_DATE OR last_reset_date IS NULL)
  RETURNING true INTO needs_reset;
  
  RETURN COALESCE(needs_reset, false);
END;
$function$;
