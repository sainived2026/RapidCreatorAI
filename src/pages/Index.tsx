
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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: "url('/src/assets/hero-bg.jpg')"
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Header */}
      <header className="relative z-10 bg-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold text-white">
              RapidCreator.ai
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="bg-purple-600 hover:bg-purple-700">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/login")} className="text-white border-white hover:bg-white hover:text-black">
                  Login
                </Button>
                <Button onClick={() => navigate("/login")} className="bg-gradient-to-r from-purple-600 to-cyan-500">
                  Start Free Trial
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Purple badge */}
          <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-8">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-purple-200 text-sm">Generate viral content in seconds</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Generate viral{" "}
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              video content packs
            </span>
            {" "}in seconds — with AI
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The AI-powered tool designed for content creators to instantly generate viral short-form video content for YouTube Shorts, Instagram Reels, and TikToks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              onClick={handleGetStarted} 
              className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Creating for Free — No Card Needed
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span>Free forever • No credit card required • 4 packs daily</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Steps Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">
            From Idea to Viral Content in <span className="text-purple-400">4 Simple Steps</span>
          </h2>
          <p className="text-xl text-gray-300">
            Our AI works like ChatGPT, but specifically designed for short-form video content creation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              number: "1",
              icon: <Users className="h-8 w-8 text-purple-400" />,
              title: "Select Your Niche",
              description: "Choose from Gaming, Finance, Motivation, and more specialized niches."
            },
            {
              number: "2",
              icon: <Zap className="h-8 w-8 text-purple-400" />,
              title: "Choose Format & Style",
              description: "Pick YouTube Short, Instagram Reel, or TikTok with Hook-first, Storytelling, or Stats-based styles."
            },
            {
              number: "3",
              icon: <Play className="h-8 w-8 text-purple-400" />,
              title: "Set Video Length",
              description: "Select your preferred duration - all optimized for under 60 seconds."
            },
            {
              number: "4",
              icon: <Star className="h-8 w-8 text-purple-400" />,
              title: "Generate Content Pack",
              description: "Get viral title, script, hashtags, thumbnail text, and design ideas instantly."
            }
          ].map((step, index) => (
            <Card key={index} className="relative bg-gray-900/80 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>
                <div className="flex justify-center mb-4">
                  {step.icon}
                </div>
                <CardTitle className="text-xl text-white">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-300">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold mb-4 text-white">
            Don't skip content today — get your script in 1 click!
          </h3>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            Generate Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Simple Pricing for <span className="text-purple-400">Every Creator</span>
          </h2>
          <p className="text-xl text-gray-300">
            Start free, upgrade when you need more power
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative bg-gray-900/80 backdrop-blur-sm border-gray-700/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Free Plan</CardTitle>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-white">$0</span>
              </div>
              <CardDescription className="text-gray-300">Perfect for trying out the platform</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">4 content packs per day</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">All content formats (YouTube, TikTok, Reels)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Basic thumbnail ideas</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-sm">✗</span>
                  <span className="text-sm text-gray-400">No regenerate button</span>
                </div>
              </div>
              
              <Button 
                onClick={handleGetStarted}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
              >
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative bg-gray-900/80 backdrop-blur-sm border-purple-500/50 shadow-lg shadow-purple-500/20">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-600 text-white">
                Most Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Pro Plan</CardTitle>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-white">$6</span>
                <span className="text-gray-300">/month</span>
              </div>
              <CardDescription className="text-gray-300">For serious content creators</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">10 content packs per day</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Regenerate option for perfect content</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">HD thumbnail design ideas</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Priority support</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate("/plans")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Loved by <span className="text-purple-400">Content Creators</span>
          </h2>
          <p className="text-xl text-gray-300">
            See what creators are saying about RapidCreator.ai
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Alex Chen",
              role: "YouTube Creator",
              content: "This tool has completely transformed my content creation process. I went from spending hours on scripts to generating viral content in minutes!"
            },
            {
              name: "Sarah Martinez",
              role: "TikTok Influencer",
              content: "The AI understands what makes content viral. My engagement rates have increased by 300% since I started using RapidCreator.ai."
            },
            {
              name: "Mike Johnson",
              role: "Instagram Creator",
              content: "As a faceless creator, this tool is a game-changer. The scripts are always on-point and the thumbnail ideas are genius!"
            }
          ].map((testimonial, index) => (
            <Card key={index} className="bg-gray-900/80 backdrop-blur-sm border-gray-700/50">
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="text-white font-medium">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Ready to Create <span className="text-purple-400">Viral Content?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of content creators who are already using AI to generate viral video content packs in seconds.
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted} 
            className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Start Creating for Free — No Card Needed
          </Button>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-400 mt-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span>4 free content packs daily • Upgrade anytime • Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-purple-400" />
                <span className="font-bold text-white">RapidCreator.ai</span>
              </div>
              <p className="text-gray-400 text-sm">
                Generate viral video content packs in seconds with AI.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-gray-400 hover:text-white block">Features</a>
                <a href="#" className="text-gray-400 hover:text-white block">Pricing</a>
                <a href="#" className="text-gray-400 hover:text-white block">Demo</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-gray-400 hover:text-white block">Help Center</a>
                <a href="#" className="text-gray-400 hover:text-white block">Contact</a>
                <a href="#" className="text-gray-400 hover:text-white block">Status</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-gray-400 hover:text-white block">About</a>
                <a href="#" className="text-gray-400 hover:text-white block">Privacy</a>
                <a href="#" className="text-gray-400 hover:text-white block">Terms</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 RapidCreator.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
