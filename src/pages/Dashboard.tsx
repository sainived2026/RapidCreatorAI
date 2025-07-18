import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { niche, format, style, videoLength },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Generation failed",
          description: data.message || data.error,
          variant: "destructive",
        });
        return;
      }

      setGeneratedContent(data);
      fetchProfile(); // Refresh profile to update usage count
      
      toast({
        title: "Content generated!",
        description: "Your viral content pack is ready.",
      });
    } catch (error: any) {
      toast({
        title: "Error generating content",
        description: error.message,
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

  if (!user || !profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
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
            <Badge variant={profile.plan === 'pro' ? 'default' : 'secondary'}>
              {profile.plan === 'pro' ? (
                <><Crown className="h-3 w-3 mr-1" /> Pro</>
              ) : (
                'Free'
              )}
            </Badge>
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
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Payment Status Messages */}
        {paymentStatus === 'cancelled' && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">Payment not confirmed. Please try upgrading again or contact support if you believe this is an error.</p>
            </CardContent>
          </Card>
        )}

        {paymentStatus === 'success' && profile?.plan !== 'pro' && (
          <Card className="mb-6 border-yellow-500">
            <CardContent className="pt-6">
              <p className="text-yellow-600 font-medium">Payment confirmed! Your account is being upgraded to Pro. This may take a few moments to update.</p>
            </CardContent>
          </Card>
        )}

        {!showHistory ? (
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Generate Viral Content
              </h1>
              <p className="text-muted-foreground mb-4">
                Create engaging short-form video content in seconds
              </p>
              <div className="text-sm text-muted-foreground">
                You have used {profile.daily_generations_used} of {profile.daily_generations_limit} generations today
              </div>
            </div>

            {/* Input Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Content Generation Settings</CardTitle>
                <CardDescription>Fill in the details to generate your viral content pack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche</Label>
                    <Input
                      id="niche"
                      placeholder="e.g., Gaming, Finance, Motivation"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
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
                    <Label htmlFor="style">Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger>
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
                    <Label htmlFor="videoLength">Video Length</Label>
                    <Input
                      id="videoLength"
                      value={videoLength}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={loading || !niche || !format || !style}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Content Pack
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content */}
            {generatedContent && (
              <>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      Your Content Pack (Generated)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">📌 Title:</h3>
                      <p className="text-foreground">{generatedContent.title}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">📝 Description:</h3>
                      <p className="text-foreground">{generatedContent.description}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">🎙️ Script:</h3>
                      <p className="text-foreground whitespace-pre-wrap">{generatedContent.script}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">🏷️ Hashtags:</h3>
                      <p className="text-foreground">{generatedContent.hashtags}</p>
                    </div>
                    
                    <Separator />
                    
                    {/* Updated thumbnail section to show generated image */}
                    <div>
                      <h3 className="font-semibold mb-2">🖼️ Generated Thumbnail:</h3>
                      {generatedContent.thumbnailUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={generatedContent.thumbnailUrl} 
                            alt="Generated Thumbnail" 
                            className="max-w-md rounded-lg border"
                          />
                          <p className="text-sm text-muted-foreground">
                            <strong>Design Concept:</strong> {generatedContent.thumbnailDesignIdea}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-muted-foreground">Thumbnail generation unavailable</p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Design Idea:</strong> {generatedContent.thumbnailDesignIdea}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {profile.plan === 'pro' && (
                      <div className="pt-4">
                        <Button onClick={handleRegenerate} variant="outline" disabled={loading}>
                          🔄 Regenerate
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Export Options */}
                <ExportOptions 
                  generatedContent={generatedContent}
                  niche={niche}
                  format={format}
                  style={style}
                />

                {/* Viral Score */}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Content History</h2>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={deleteAllHistory}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
                <Button variant="outline" onClick={() => setShowHistory(false)}>
                  Back to Generator
                </Button>
              </div>
            </div>

            <Card className="mb-4 border-yellow-500">
              <CardContent className="pt-6 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">
                  Content automatically deletes after 30 days to keep your workspace clean.
                </span>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>
                      {item.niche} • {item.format} • {item.style} • {new Date(item.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Script:</strong> {item.script}</p>
                      <p><strong>Hashtags:</strong> {item.hashtags}</p>
                      <p><strong>Thumbnail Design:</strong> {item.thumbnail_design_idea}</p>
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
