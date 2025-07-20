
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
      
      console.log('Checking daily limit reset for user:', userId);
      
      // Call the database function to check and reset if needed
      const { data: wasReset, error } = await supabase
        .rpc('check_and_reset_user_daily_usage', { user_uuid: userId });

      if (error) {
        console.error('Error checking daily limit reset:', error);
        toast({
          title: "Reset check failed",
          description: "Unable to check daily limit status. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      console.log('Reset check result:', wasReset);

      if (wasReset) {
        console.log('Daily limit was reset for user:', userId);
        toast({
          title: "Daily limit reset! 🎉",
          description: "Your daily generation limit has been refreshed for today.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in daily limit reset check:', error);
      toast({
        title: "Reset check failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-check on mount if user ID is available
  useEffect(() => {
    if (userId) {
      console.log('Auto-checking daily limit reset on mount for user:', userId);
      checkAndResetDailyLimit();
    }
  }, [userId]);

  return {
    checkAndResetDailyLimit,
    isChecking
  };
};
