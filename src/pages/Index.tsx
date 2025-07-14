import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Users, TrendingUp, Play, Sparkles, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              RapidCreator.ai
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
            <Button variant="hero" onClick={() => navigate("/plans")}>Start Free Trial</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
            🚀 Generate viral content in seconds
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Generate viral{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              video content packs
            </span>{" "}
            in seconds — with AI
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The AI-powered tool designed for content creators to instantly generate 
            viral short-form video content for YouTube Shorts, Instagram Reels, and TikToks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/login")}>
              <Play className="mr-2 h-5 w-5" />
              Start Creating for Free — No Card Needed
            </Button>
          </div>
          
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-success mr-2" />
            Free forever • No credit card required • 2 packs daily
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              From Idea to Viral Content in{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                4 Simple Steps
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI works like ChatGPT, but specifically designed for short-form video content creation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Select Your Niche",
                description: "Choose from Gaming, Finance, Motivation, and more specialized niches.",
                icon: Users
              },
              {
                step: "2", 
                title: "Choose Format & Style",
                description: "Pick YouTube Short, Instagram Reel, or TikTok with Hook-first, Storytelling, or Stats-based styles.",
                icon: Zap
              },
              {
                step: "3",
                title: "Set Video Length",
                description: "Select your preferred duration - all optimized for under 60 seconds.",
                icon: Play
              },
              {
                step: "4",
                title: "Generate Content Pack",
                description: "Get viral title, script, hashtags, thumbnail text, and design ideas instantly.",
                icon: TrendingUp
              }
            ].map((item, index) => (
              <Card key={index} className="bg-card border-border hover:shadow-card transition-all duration-300">
                <CardHeader className="text-center pb-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-background">{item.step}</span>
                  </div>
                  <item.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 bg-gradient-subtle">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            Don't skip content today — get your script in 1 click!
          </h3>
          <Button variant="accent" size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/login")}>
            Generate Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Simple Pricing for{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Every Creator
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-card border-border">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">Free Plan</CardTitle>
                <div className="text-4xl font-bold mb-2">$0</div>
                <CardDescription>Perfect for trying out the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>2 content packs per day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>All content formats (YouTube, TikTok, Reels)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>Basic thumbnail ideas</span>
                </div>
                <div className="flex items-center opacity-50">
                  <span className="w-5 h-5 mr-3">✗</span>
                  <span>No regenerate button</span>
                </div>
                <Button variant="outline" className="w-full mt-6" onClick={() => navigate("/login")}>
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-primary/10 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-primary text-background px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">Pro Plan</CardTitle>
                <div className="text-4xl font-bold mb-2">
                  $6<span className="text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription>For serious content creators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>5 content packs per day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>Regenerate option for perfect content</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>HD thumbnail design ideas</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-3" />
                  <span>Priority support</span>
                </div>
                <Button variant="hero" className="w-full mt-6" onClick={() => navigate("/plans")}>
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gradient-subtle">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Loved by{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Content Creators
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what creators are saying about RapidCreator.ai
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Chen",
                role: "YouTube Creator",
                content: "This tool has completely transformed my content creation process. I went from spending hours on scripts to generating viral content in minutes!",
                rating: 5
              },
              {
                name: "Sarah Martinez",
                role: "TikTok Influencer", 
                content: "The AI understands what makes content viral. My engagement rates have increased by 300% since I started using RapidCreator.ai.",
                rating: 5
              },
              {
                name: "Mike Johnson",
                role: "Instagram Creator",
                content: "As a faceless creator, this tool is a game-changer. The scripts are always on-point and the thumbnail ideas are genius!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-warning fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Create{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Viral Content?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of content creators who are already using AI to generate viral video content packs in seconds.
          </p>
          
          <Button variant="hero" size="lg" className="text-xl px-12 py-8 mb-4" onClick={() => navigate("/login")}>
            <Sparkles className="mr-3 h-6 w-6" />
            Start Creating for Free — No Card Needed
          </Button>
          
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-success mr-2" />
            2 free content packs daily • Upgrade anytime • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  RapidCreator.ai
                </span>
              </div>
              <p className="text-muted-foreground">
                Generate viral video content packs in seconds with AI.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 RapidCreator.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
