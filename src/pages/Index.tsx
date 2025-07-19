
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
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              RapidCreator.ai
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-sm">
              Login
            </Button>
            <Button variant="hero" size="sm" onClick={() => navigate("/plans")} className="text-sm px-3 sm:px-4">
              Start Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <Badge className="mb-4 sm:mb-6 bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
            🚀 Generate viral content in seconds
          </Badge>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
            Generate viral{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              video content packs
            </span>{" "}
            in seconds — with AI
          </h1>
          
          <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            The AI-powered tool designed for content creators to instantly generate 
            viral short-form video content for YouTube Shorts, Instagram Reels, and TikToks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 min-h-[48px]" 
              onClick={() => navigate("/login")}
            >
              <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Start Creating for Free — No Card Needed
            </Button>
          </div>
          
          <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground px-4">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success mr-2 flex-shrink-0" />
            Free forever • No credit card required • 4 packs daily
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 px-4">
              From Idea to Viral Content in{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                4 Simple Steps
              </span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Our AI works like ChatGPT, but specifically designed for short-form video content creation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
              <Card key={index} className="bg-card border-border hover:shadow-card transition-all duration-300 h-full">
                <CardHeader className="text-center pb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-base sm:text-lg font-bold text-background">{item.step}</span>
                  </div>
                  <item.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg sm:text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-sm sm:text-base">{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-subtle">
        <div className="container mx-auto text-center">
          <h3 className="text-xl sm:text-3xl font-bold mb-4 px-4">
            Don't skip content today — get your script in 1 click!
          </h3>
          <Button 
            variant="accent" 
            size="lg" 
            className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 min-h-[48px]" 
            onClick={() => navigate("/login")}
          >
            Generate Now
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 px-4">
              Simple Pricing for{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Every Creator
              </span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground px-4">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-card border-border h-full">
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="text-xl sm:text-2xl mb-2">Free Plan</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold mb-2">$0</div>
                <CardDescription className="text-sm sm:text-base">Perfect for trying out the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">4 content packs per day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">All content formats (YouTube, TikTok, Reels)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Basic thumbnail ideas</span>
                </div>
                <div className="flex items-center opacity-50">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 mr-3 flex-shrink-0 text-sm sm:text-base">✗</span>
                  <span className="text-sm sm:text-base">No regenerate button</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 sm:mt-6 min-h-[44px] text-sm sm:text-base" 
                  onClick={() => navigate("/login")}
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-primary/10 border-primary relative h-full">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-primary text-background px-3 sm:px-4 py-1 text-xs sm:text-sm">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="text-xl sm:text-2xl mb-2">Pro Plan</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold mb-2">
                  $6<span className="text-base sm:text-lg text-muted-foreground">/month</span>
                </div>
                <CardDescription className="text-sm sm:text-base">For serious content creators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">10 content packs per day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Regenerate option for perfect content</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">HD thumbnail design ideas</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Priority support</span>
                </div>
                <Button 
                  variant="hero" 
                  className="w-full mt-4 sm:mt-6 min-h-[44px] text-sm sm:text-base" 
                  onClick={() => navigate("/plans")}
                >
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-subtle">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 px-4">
              Loved by{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Content Creators
              </span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground px-4">
              See what creators are saying about RapidCreator.ai
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
              <Card key={index} className="bg-card border-border h-full">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-warning fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-4">
            Ready to Create{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Viral Content?
            </span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of content creators who are already using AI to generate viral video content packs in seconds.
          </p>
          
          <Button 
            variant="hero" 
            size="lg" 
            className="text-base sm:text-xl px-8 sm:px-12 py-6 sm:py-8 mb-4 min-h-[48px] w-full sm:w-auto" 
            onClick={() => navigate("/login")}
          >
            <Sparkles className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
            Start Creating for Free — No Card Needed
          </Button>
          
          <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground px-4">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success mr-2 flex-shrink-0" />
            4 free content packs daily • Upgrade anytime • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  RapidCreator.ai
                </span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Generate viral video content packs in seconds with AI.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-muted-foreground text-sm sm:text-base">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-muted-foreground text-xs sm:text-sm">
            <p>&copy; 2024 RapidCreator.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
