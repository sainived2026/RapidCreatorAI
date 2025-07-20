
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  plan: 'free' | 'pro';
  daily_generations_limit: number;
  daily_generations_used: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      // Ensure plan is typed correctly
      return {
        ...data,
        plan: data.plan as 'free' | 'pro'
      } as UserProfile;
    },
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
      toast.error('Failed to update generation count');
      return;
    }
    
    // Invalidate and refetch the profile
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  const hasGenerationsLeft = profile 
    ? profile.daily_generations_used < profile.daily_generations_limit 
    : false;

  const generationsRemaining = profile 
    ? Math.max(0, profile.daily_generations_limit - profile.daily_generations_used)
    : 0;

  return {
    profile,
    isLoading,
    updateGenerationCount,
    hasGenerationsLeft,
    generationsRemaining
  };
};
