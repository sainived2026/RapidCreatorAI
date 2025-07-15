import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Crown, History, LogOut, Wand2, User, Settings, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [niche, setNiche] = useState("");
  const [format, setFormat] = useState("");
  const [style, setStyle] = useState("");
  const [videoLength] = useState("Under 60 seconds");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate("/login");
        } else {
          setUser(session.user);
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      }
    );

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
    };

    getSession();
    return () => subscription.unsubscribe();
  }, [navigate]);

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
      fetchProfile();
      
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

  const handleRegenerateThumbnail = async () => {
    if (profile?.plan !== 'pro') {
      toast({
        title: "Pro feature",
        description: "Upgrade to Pro to access thumbnail regeneration.",
        variant: "destructive",
      });
      return;
    }
    
    // For now, just regenerate the entire content pack
    await handleGenerateContent();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleNewChat = () => {
    setGeneratedContent(null);
    setNiche("");
    setFormat("");
    setStyle("");
    setActiveTab("generate");
  };

  const handleViewHistory = () => {
    setActiveTab("history");
    fetchHistory();
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className="w-72 bg-muted/20 border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RapidCreator.ai
            </span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-border">
          <Button 
            onClick={handleNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <PlusCircle className="h-4 w-4" />
            New Generation
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          <Button
            variant={activeTab === "generate" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => setActiveTab("generate")}
          >
            <Wand2 className="h-4 w-4" />
            Generate Content
          </Button>
          <Button
            variant={activeTab === "history" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={handleViewHistory}
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user.email}
              </div>
              <div className="text-xs text-muted-foreground">
                {profile.daily_generations_used}/{profile.daily_generations_limit} generations used
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={profile.plan === 'pro' ? 'default' : 'secondary'} className="text-xs">
              {profile.plan === 'pro' ? (
                <><Crown className="h-3 w-3 mr-1" /> Pro</>
              ) : (
                'Free Plan'
              )}
            </Badge>
          </div>

          <div className="space-y-2">
            {profile.plan !== 'pro' && (
              <Button 
                variant="default" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => navigate("/plans")}
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade to Pro
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={handleSignOut}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {activeTab === "generate" ? "Generate Viral Content" : "Content History"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "generate" 
                    ? "Create engaging short-form video content in seconds"
                    : "View your previously generated content packs"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{profile.daily_generations_limit - profile.daily_generations_used} generations left today</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {activeTab === "generate" ? (
            <div className="max-w-4xl mx-auto p-6">
              {/* Input Form */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Content Settings</CardTitle>
                  <CardDescription>Configure your content generation parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Label htmlFor="format">Video Type</Label>
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
                      <Label htmlFor="videoLength">Length</Label>
                      <Input
                        id="videoLength"
                        value={videoLength}
                        disabled
                        className="bg-muted"
                      />
                    </div>
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
                  
                  <Button 
                    onClick={handleGenerateContent} 
                    disabled={loading || !niche || !format || !style}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                        Generating Video Pack...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Video Pack
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Content */}
              {generatedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Generated Content Pack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-primary">Title</h3>
                      <p className="text-foreground font-medium">{generatedContent.title}</p>
                    </div>
                    
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-primary">Description</h3>
                      <p className="text-foreground">{generatedContent.description}</p>
                    </div>
                    
                    {/* Script */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-primary">Script</h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-foreground whitespace-pre-wrap">{generatedContent.script}</p>
                      </div>
                    </div>
                    
                    {/* Hashtags */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-primary">Hashtags</h3>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags?.split(' ').map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Thumbnail Text */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-primary">Thumbnail Text</h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-foreground font-medium">{generatedContent.thumbnailText}</p>
                      </div>
                      {profile.plan === 'pro' && (
                        <Button 
                          onClick={handleRegenerateThumbnail} 
                          variant="outline" 
                          size="sm"
                          disabled={loading}
                          className="mt-2"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Regenerate Thumbnail
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-6">
              <div className="space-y-4">
                {history.length > 0 ? (
                  history.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>
                          {item.niche} • {item.format} • {item.style} • {new Date(item.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div>
                            <strong className="text-primary">Description:</strong>
                            <p className="mt-1">{item.description}</p>
                          </div>
                          <div>
                            <strong className="text-primary">Script:</strong>
                            <p className="mt-1">{item.script}</p>
                          </div>
                          <div>
                            <strong className="text-primary">Hashtags:</strong>
                            <p className="mt-1">{item.hashtags}</p>
                          </div>
                          <div>
                            <strong className="text-primary">Thumbnail Text:</strong>
                            <p className="mt-1">{item.thumbnail_text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No content generated yet. Start creating your first video pack!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;