
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDailyLimitReset = (userId?: string) => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkAndResetDailyLimit = async () => {
    if (!userId) return false;

    try {
      setIsChecking(true);
      
      // Call the database function to check and reset if needed
      const { data: wasReset, error } = await supabase
        .rpc('check_and_reset_user_daily_usage', { user_uuid: userId });

      if (error) {
        console.error('Error checking daily limit reset:', error);
        return false;
      }

      if (wasReset) {
        toast({
          title: "Daily limit reset!",
          description: "Your daily generation limit has been refreshed.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in daily limit reset check:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-check on mount if user ID is available
  useEffect(() => {
    if (userId) {
      checkAndResetDailyLimit();
    }
  }, [userId]);

  return {
    checkAndResetDailyLimit,
    isChecking
  };
};
