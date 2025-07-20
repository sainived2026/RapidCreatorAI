
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  plan: 'free' | 'pro';
  daily_generations_used: number;
  daily_generations_limit: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: true,
  });

  const updateGenerationCount = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        daily_generations_used: profile.daily_generations_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', profile.user_id);

    if (error) {
      console.error('Error updating generation count:', error);
      throw error;
    }

    // Invalidate and refetch the profile data
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  const hasGenerationsLeft = profile ? profile.daily_generations_used < profile.daily_generations_limit : false;
  const generationsRemaining = profile ? profile.daily_generations_limit - profile.daily_generations_used : 0;

  return {
    profile,
    isLoading,
    error,
    updateGenerationCount,
    hasGenerationsLeft,
    generationsRemaining,
  };
};
