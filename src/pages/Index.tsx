
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Check, Star, Zap, Video, Image, History, Users, Play, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    getSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      // Update user to free plan with 4 generations
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
        title: "Welcome to RapidCreator.ai!",
        description: "You now have 4 free generations per day.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error setting up account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out the platform",
      features: [
        "4 content packs per day",
        "All content formats",
        "Basic support"
      ],
      limitations: [
        "No regenerate option"
      ],
      cta: "Get Started Free",
      popular: false
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
      cta: "Upgrade to Pro",
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RapidCreator.ai
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/login")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Create Viral Content in Seconds
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Generate engaging YouTube Shorts, Instagram Reels, and TikTok videos with AI-powered scripts, thumbnails, and hashtags
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
              <Play className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/plans")} className="text-lg px-8 py-6">
              View Plans
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>4 free content packs daily</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Upgrade anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Everything You Need to Go Viral
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Zap className="h-8 w-8 text-primary" />,
              title: "AI-Powered Scripts",
              description: "Generate engaging, viral-ready scripts tailored to your niche"
            },
            {
              icon: <Video className="h-8 w-8 text-primary" />,
              title: "Multiple Formats",
              description: "YouTube Shorts, Instagram Reels, TikTok - all optimized"
            },
            {
              icon: <Image className="h-8 w-8 text-primary" />,
              title: "Thumbnail Design",
              description: "Professional thumbnail concepts that drive clicks"
            },
            {
              icon: <History className="h-8 w-8 text-primary" />,
              title: "Content History",
              description: "Save and manage all your generated content"
            }
          ].map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Simple Pricing for Every Creator
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you need more
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
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={plan.name === "Free" ? handleGetStarted : () => navigate("/plans")}
                  className="w-full"
                  variant={plan.name === "Free" ? "outline" : "default"}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Trusted by Content Creators
          </h2>
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>1000+ Creators</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>10M+ Views Generated</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ready to Create Viral Content?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of creators who've grown their audience with AI-powered content
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
            Start Creating Now - It's Free!
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                RapidCreator.ai
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>© 2024 RapidCreator.ai. All rights reserved.</span>
              <a href="mailto:sainived2026@gmail.com" className="hover:text-primary">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
