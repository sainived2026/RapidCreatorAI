
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Crown, Check, X, Loader2 } from "lucide-react";

const Plans = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
        }
      }
    );

    getSession();
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId?: string) => {
    try {
      const userIdToUse = userId || user?.id || (await supabase.auth.getUser()).data.user?.id;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userIdToUse)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      setCheckingPayment(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      // Refresh profile after subscription check
      await fetchProfile();
      
      return data;
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      return null;
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleFreePlan = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: 'free',
          daily_generations_limit: 4,
          daily_generations_used: 0
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Free plan activated!",
        description: "You now have 4 generations per day.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProPlan = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      toast({
        title: "Error creating checkout",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Check for payment status when component mounts
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      
      if (paymentStatus === 'success') {
        setCheckingPayment(true);
        const subscriptionData = await checkSubscription();
        
        if (subscriptionData?.plan === 'pro') {
          toast({
            title: "🎉 You are now Pro!",
            description: "Enjoy 10 daily generations and regenerations.",
          });
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/dashboard");
        } else {
          toast({
            title: "Sorry, payment did not complete successfully",
            description: "Please try again or contact support.",
            variant: "destructive",
          });
        }
      } else if (paymentStatus === 'cancelled') {
        toast({
          title: "Payment cancelled",
          description: "Your payment was cancelled. You can try again anytime.",
          variant: "destructive",
        });
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    if (user) {
      checkPaymentStatus();
    }
  }, [user]);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out the platform",
      features: [
        "4 content packs per day",
        "All content formats",
        "Basic support",
        "No regenerate option"
      ],
      limitations: [
        "Limited generations",
        "No regeneration",
        "Basic features only"
      ],
      current: profile?.plan === 'free',
      action: handleFreePlan,
      variant: "outline" as const
    },
    {
      name: "Pro",
      price: "$6",
      period: "per month",
      description: "For serious content creators",
      features: [
        "10 content packs per day",
        "All content formats",
        "Regenerate option",
        "Priority support",
        "HD thumbnail ideas",
        "Advanced analytics"
      ],
      limitations: [],
      current: profile?.plan === 'pro',
      action: handleProPlan,
      variant: "hero" as const,
      popular: true
    }
  ];

  if (checkingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Checking payment status...</p>
        </div>
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
          
          <div className="flex items-center gap-4">
            {user && (
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            )}
            {!user && (
              <Button variant="outline" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Select the perfect plan for your content creation needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Crown className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={plan.action}
                  disabled={loading || plan.current}
                  className="w-full"
                  variant={plan.variant}
                >
                  {loading && plan.name === "Pro" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : plan.current ? (
                    "Current Plan"
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Need help choosing? Contact us at{" "}
            <a href="mailto:sainived2026@gmail.com" className="text-primary hover:underline">
              sainived2026@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Plans;
