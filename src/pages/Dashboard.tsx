import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDailyLimitReset } from "@/hooks/useDailyLimitReset";
import { Sparkles, Crown, History, LogOut, Wand2, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ExportOptions from "@/components/ExportOptions";
import ViralScore from "@/components/ViralScore";
import UpgradeModal from "@/components/UpgradeModal";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [niche, setNiche] = useState("");
  const [format, setFormat] = useState("");
  const [style, setStyle] = useState("");
  const [videoLength] = useState("Under 60 seconds");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Use the daily limit reset hook
  const { checkAndResetDailyLimit } = useDailyLimitReset(user?.id);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate("/login");
        } else {
          setUser(session.user);
          // Defer profile fetching to avoid auth deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkSubscription();
          }, 0);
        }
      }
    );

    // Check initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
      checkSubscription();
    };

    getSession();
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check for payment status in URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const payment = searchParams.get('payment');
    
    if (payment === 'success') {
      setPaymentStatus('success');
      // Check subscription status after successful payment
      setTimeout(() => {
        checkSubscription();
      }, 2000);
      toast({
        title: "Payment Successful!",
        description: "Your subscription is being updated...",
      });
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [location.search, toast]);

  const fetchProfile = async (userId?: string) => {
    try {
      const userIdToUse = userId || user?.id || (await supabase.auth.getUser()).data.user?.id;
      
      // Check and reset daily limit first
      if (userIdToUse) {
        await checkAndResetDailyLimit();
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userIdToUse)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const checkSubscription = async () => {
    try {
      setCheckingSubscription(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      // Refresh profile after subscription check
      fetchProfile();
    } catch (error: any) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleUpgrade = async () => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Store the current path to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', '/app?upgrade=true');
      navigate("/login");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast({
        title: "Error creating checkout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      // Open customer portal in new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast({
        title: "Error opening customer portal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('content_packs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching history",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGenerateContent = async () => {
    if (!niche || !format || !style) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields before generating content.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedContent(null); // Clear previous content
    
    try {
      console.log("Starting content generation with:", { niche, format, style, videoLength });
      
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { niche, format, style, videoLength },
      });

      console.log("Function response:", { data, error });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to generate content");
      }

      if (data?.error) {
        console.error("Function returned error:", data);
        toast({
          title: "Generation failed",
          description: data.message || data.error,
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.title) {
        console.error("Invalid response data:", data);
        toast({
          title: "Generation failed",
          description: "Received invalid response. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Content generated successfully:", data);
      setGeneratedContent(data);
      fetchProfile(); // Refresh profile to update usage count
      
      toast({
        title: "Content generated!",
        description: "Your viral content pack is ready.",
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Error generating content",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (profile?.plan !== 'pro') {
      toast({
        title: "Pro feature",
        description: "Upgrade to Pro to access regeneration.",
        variant: "destructive",
      });
      return;
    }
    
    await handleGenerateContent();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      fetchHistory();
    }
  };

  const deleteAllHistory = async () => {
    if (!confirm("Are you sure you want to delete all your content history? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('content_packs')
        .delete()
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setHistory([]);
      toast({
        title: "History cleared",
        description: "All your content history has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting history",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteOldContent = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error } = await supabase
        .from('content_packs')
        .delete()
        .eq('user_id', user?.id)
        .lt('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      
      // Refresh history
      fetchHistory();
    } catch (error: any) {
      console.error('Error deleting old content:', error);
    }
  };

  // Auto-delete old content on load
  useEffect(() => {
    if (user) {
      deleteOldContent();
    }
  }, [user]);

  // Calculate hours until next reset
  const getHoursUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60));
  };

  if (!user || !profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header - Mobile Optimized */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RapidCreator.ai
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Badge variant={profile.plan === 'pro' ? 'default' : 'secondary'} className="text-xs">
              {profile.plan === 'pro' ? (
                <><Crown className="h-3 w-3 mr-1" /> Pro</>
              ) : (
                'Free'
              )}
            </Badge>
            
            {/* Mobile: Show only essential buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleViewHistory}>
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              {profile.plan !== 'pro' ? (
                <UpgradeModal onUpgrade={handleUpgrade}>
                  <Button variant="default" size="sm">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </UpgradeModal>
              ) : (
                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                  <Crown className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
            </div>
            
            {/* Mobile: Compact buttons */}
            <div className="flex sm:hidden items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleViewHistory}>
                <History className="h-4 w-4" />
              </Button>
              {profile.plan !== 'pro' ? (
                <UpgradeModal onUpgrade={handleUpgrade}>
                  <Button variant="default" size="sm">
                    <Crown className="h-4 w-4" />
                  </Button>
                </UpgradeModal>
              ) : (
                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                  <Crown className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-full overflow-x-hidden">
        {/* Payment Status Messages - Mobile Optimized */}
        {paymentStatus === 'cancelled' && (
          <Card className="mb-4 sm:mb-6 border-destructive">
            <CardContent className="pt-4 sm:pt-6">
              <p className="text-destructive font-medium text-sm sm:text-base">Payment not confirmed. Please try upgrading again or contact support if you believe this is an error.</p>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'success' && profile?.plan !== 'pro' && (
          <Card className="mb-4 sm:mb-6 border-yellow-500">
            <CardContent className="pt-4 sm:pt-6">
              <p className="text-yellow-600 font-medium text-sm sm:text-base">Payment confirmed! Your account is being upgraded to Pro. This may take a few moments to update.</p>
            </CardContent>
          </Card>
        )}

        {!showHistory ? (
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section - Mobile Optimized */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                Generate Viral Content
              </h1>
              <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base px-2">
                Create engaging short-form video content in seconds
              </p>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <div>
                  You have used {profile.daily_generations_used} of {profile.daily_generations_limit} generations today
                </div>
                {profile.daily_generations_used >= profile.daily_generations_limit && (
                  <div className="text-yellow-600">
                    Limit resets in {getHoursUntilReset()} hours (midnight UTC)
                  </div>
                )}
              </div>
            </div>

            {/* Input Form - Mobile Optimized */}
            <Card className="mb-6 sm:mb-8">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Content Generation Settings</CardTitle>
                <CardDescription className="text-sm sm:text-base">Fill in the details to generate your viral content pack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="niche" className="text-sm sm:text-base">Niche</Label>
                    <Input
                      id="niche"
                      placeholder="e.g., Gaming, Finance, Motivation"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      className="h-10 sm:h-auto text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-sm sm:text-base">Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger className="h-10 sm:h-auto text-base">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YouTube Short">YouTube Short</SelectItem>
                        <SelectItem value="Instagram Reel">Instagram Reel</SelectItem>
                        <SelectItem value="TikTok">TikTok</SelectItem>
                        <SelectItem value="Carousel">Carousel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-sm sm:text-base">Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="h-10 sm:h-auto text-base">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hook-based">Hook-based</SelectItem>
                        <SelectItem value="Storytelling">Storytelling</SelectItem>
                        <SelectItem value="Stats">Stats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="videoLength" className="text-sm sm:text-base">Video Length</Label>
                    <Input
                      id="videoLength"
                      value={videoLength}
                      disabled
                      className="bg-muted h-10 sm:h-auto text-base"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={loading || !niche || !format || !style || profile.daily_generations_used >= profile.daily_generations_limit}
                  className="w-full h-12 sm:h-auto text-base font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                      Generating...
                    </>
                  ) : profile.daily_generations_used >= profile.daily_generations_limit ? (
                    'Daily Limit Reached'
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Content Pack
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content - Mobile Optimized */}
            {generatedContent && (
              <>
                <Card className="mb-4">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Wand2 className="h-5 w-5" />
                      Your Content Pack (Generated)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">📌 Title:</h3>
                      <p className="text-foreground text-sm sm:text-base leading-relaxed">{generatedContent.title}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">📝 Description:</h3>
                      <p className="text-foreground text-sm sm:text-base leading-relaxed">{generatedContent.description}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">🎙️ Script:</h3>
                      <p className="text-foreground whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{generatedContent.script}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">🏷️ Hashtags:</h3>
                      <p className="text-foreground text-sm sm:text-base leading-relaxed break-all">{generatedContent.hashtags}</p>
                    </div>
                    
                    <Separator />
                    
                    {/* Enhanced thumbnail section - Mobile Optimized */}
                    <div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">🖼️ Thumbnail Design:</h3>
                      {generatedContent.thumbnailUrl ? (
                        <div className="space-y-3">
                          <div className="relative flex justify-center">
                            <img 
                              src={generatedContent.thumbnailUrl} 
                              alt="Generated Thumbnail" 
                              className="max-w-full h-auto rounded-lg border shadow-lg"
                              style={{ maxWidth: '300px', aspectRatio: '9/16' }}
                            />
                          </div>
                          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                            <h4 className="font-medium text-xs sm:text-sm mb-2">Design Concept:</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {generatedContent.thumbnailDesignIdea}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                          <h4 className="font-medium text-xs sm:text-sm mb-2">Design Concept:</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {generatedContent.thumbnailDesignIdea}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {profile.plan === 'pro' && (
                      <div className="pt-4">
                        <Button onClick={handleRegenerate} variant="outline" disabled={loading} className="w-full sm:w-auto h-10 sm:h-auto">
                          🔄 Regenerate
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Export Options - Mobile Optimized */}
                <ExportOptions 
                  generatedContent={generatedContent}
                  niche={niche}
                  format={format}
                  style={style}
                />

                {/* Viral Score - Mobile Optimized */}
                <ViralScore 
                  generatedContent={generatedContent}
                  niche={niche}
                  style={style}
                />
              </>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Content History</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={deleteAllHistory}
                  className="flex items-center gap-2 justify-center h-10 sm:h-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
                <Button variant="outline" onClick={() => setShowHistory(false)} className="h-10 sm:h-auto">
                  Back to Generator
                </Button>
              </div>
            </div>

            <Card className="mb-4 border-yellow-500">
              <CardContent className="pt-4 sm:pt-6 flex items-start sm:items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Content automatically deletes after 30 days to keep your workspace clean.
                </span>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg leading-tight">{item.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {item.niche} • {item.format} • {item.style} • {new Date(item.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p><strong>Script:</strong> <span className="leading-relaxed">{item.script}</span></p>
                      <p><strong>Hashtags:</strong> <span className="break-all leading-relaxed">{item.hashtags}</span></p>
                      <p><strong>Thumbnail Design:</strong> <span className="leading-relaxed">{item.thumbnail_design_idea}</span></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
