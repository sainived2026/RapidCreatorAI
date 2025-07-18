
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";

const Success = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        checkPaymentStatus();
      } else {
        navigate("/login");
      }
    };

    checkUser();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      console.log('Checking subscription status...');
      
      // Check subscription status through our edge function
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }

      console.log('Subscription check response:', data);

      if (data?.plan === 'pro') {
        setSuccess(true);
        
        // Update user profile with pro plan
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            plan: 'pro',
            daily_generations_limit: 10,
            daily_generations_used: 0
          })
          .eq('user_id', user?.id || (await supabase.auth.getUser()).data.user?.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }

        toast({
          title: "🎉 You're now Pro!",
          description: "Enjoy 10 daily generations and regenerations.",
        });
      } else {
        setSuccess(false);
        toast({
          title: "Sorry, payment was not completed successfully",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setSuccess(false);
      toast({
        title: "Sorry, payment was not completed successfully",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <h2 className="text-xl font-semibold">Verifying your payment...</h2>
              <p className="text-muted-foreground text-center">
                Please wait while we confirm your subscription.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RapidCreator.ai
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {success ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
                <CardDescription>
                  🎉 You're now Pro! Enjoy 10 daily generations and regenerations.
                </CardDescription>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
                <CardDescription>
                  Sorry, payment was not completed successfully. Please try again or contact support.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate("/dashboard")}
              className="w-full"
              variant={success ? "default" : "outline"}
            >
              {success ? "Go to Dashboard" : "Back to Dashboard"}
            </Button>
            
            {!success && (
              <Button 
                onClick={() => navigate("/plans")}
                className="w-full"
                variant="default"
              >
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Success;
