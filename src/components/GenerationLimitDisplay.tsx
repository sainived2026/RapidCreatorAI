
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export const GenerationLimitDisplay = () => {
  const { profile, isLoading } = useUserProfile();

  if (isLoading || !profile) {
    return null;
  }

  const usagePercentage = (profile.daily_generations_used / profile.daily_generations_limit) * 100;
  const isLimitReached = profile.daily_generations_used >= profile.daily_generations_limit;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Daily Generations</h3>
          <Badge variant={profile.plan === 'pro' ? 'default' : 'secondary'}>
            {profile.plan.toUpperCase()}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {profile.daily_generations_used} of {profile.daily_generations_limit} used
            </span>
            <span className="text-gray-500">
              Resets daily at midnight UTC
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-2"
          />
          
          {isLimitReached && (
            <p className="text-sm text-red-600 mt-2">
              Daily limit reached. {profile.plan === 'free' ? 'Upgrade to Pro for more generations!' : 'Limit will reset at midnight UTC.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
