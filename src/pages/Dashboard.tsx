import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Video, ImageIcon, Sparkles, LogOut } from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ExportOptions } from "@/components/ExportOptions";
import { ViralScore } from "@/components/ViralScore";
import { GenerationLimitDisplay } from "@/components/GenerationLimitDisplay";
import { useUserProfile } from "@/hooks/useUserProfile";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, updateGenerationCount, hasGenerationsLeft, generationsRemaining } = useUserProfile();
  
  const [formData, setFormData] = useState({
    niche: "",
    format: "",
    style: "",
    videoLength: "",
    customPrompt: ""
  });
  
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleGenerate = async () => {
    // Check if user has generations left
    if (!hasGenerationsLeft) {
      if (profile?.plan === 'free') {
        setShowUpgradeModal(true);
        return;
      } else {
        toast.error("Daily generation limit reached. It will reset at midnight UTC.");
        return;
      }
    }

    if (!formData.niche || !formData.format || !formData.style || !formData.videoLength) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          niche: formData.niche,
          format: formData.format,
          style: formData.style,
          videoLength: formData.videoLength,
          customPrompt: formData.customPrompt
        }
      });

      if (error) throw error;

      // Update the generation count
      await updateGenerationCount();

      setGeneratedContent(data);
      toast.success("Content generated successfully!");
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ContentCraft AI
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {profile && (
                <div className="hidden sm:flex flex-col items-end">
                  <Badge variant={profile.plan === 'pro' ? 'default' : 'secondary'} className="text-xs">
                    {profile.plan.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-600 mt-1">
                    {generationsRemaining} left today
                  </span>
                </div>
              )}
              
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Content Generation */}
          <div className="lg:col-span-2 space-y-6">
            <GenerationLimitDisplay />
            
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-xl sm:text-2xl">
                  <Video className="w-6 h-6 text-purple-600" />
                  <span>Generate Content</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Create viral video content with AI-powered scripts, thumbnails, and hashtags
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niche" className="text-sm font-medium">Niche *</Label>
                    <Select value={formData.niche} onValueChange={(value) => setFormData(prev => ({ ...prev, niche: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your niche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fitness">Fitness & Health</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="business">Business & Finance</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="food">Food & Cooking</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-sm font-medium">Content Format *</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tutorial">Tutorial/How-to</SelectItem>
                        <SelectItem value="tips">Tips & Tricks</SelectItem>
                        <SelectItem value="story">Storytelling</SelectItem>
                        <SelectItem value="review">Product Review</SelectItem>
                        <SelectItem value="challenge">Challenge/Trend</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-sm font-medium">Content Style *</Label>
                    <Select value={formData.style} onValueChange={(value) => setFormData(prev => ({ ...prev, style: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual & Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="humorous">Humorous & Fun</SelectItem>
                        <SelectItem value="dramatic">Dramatic & Intense</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="trendy">Trendy & Hip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoLength" className="text-sm font-medium">Video Length *</Label>
                    <Select value={formData.videoLength} onValueChange={(value) => setFormData(prev => ({ ...prev, videoLength: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15-30s">15-30 seconds</SelectItem>
                        <SelectItem value="30-60s">30-60 seconds</SelectItem>
                        <SelectItem value="1-2min">1-2 minutes</SelectItem>
                        <SelectItem value="2-5min">2-5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPrompt" className="text-sm font-medium">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="customPrompt"
                    placeholder="Add any specific requirements or ideas for your content..."
                    value={formData.customPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !hasGenerationsLeft}
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Content ({generationsRemaining} left)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Generated Content */}
          <div className="space-y-6">
            {generatedContent && (
              <>
                <ViralScore content={generatedContent} />
                
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      <span>Generated Content</span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <Tabs defaultValue="script" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="script" className="text-xs">Script</TabsTrigger>
                        <TabsTrigger value="thumbnail" className="text-xs">Thumbnail</TabsTrigger>
                        <TabsTrigger value="hashtags" className="text-xs">Hashtags</TabsTrigger>
                        <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="script" className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-purple-700 mb-2">Title:</h4>
                          <p className="text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">
                            {generatedContent.title}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-2">Description:</h4>
                          <p className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200 leading-relaxed">
                            {generatedContent.description}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">Script:</h4>
                          <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                            {generatedContent.script}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="thumbnail" className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-2">Thumbnail Text:</h4>
                          <p className="text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                            {generatedContent.thumbnailText}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-pink-700 mb-2">Design Concept:</h4>
                          <p className="text-sm bg-pink-50 p-3 rounded-lg border border-pink-200 leading-relaxed">
                            {generatedContent.thumbnailDesignIdea}
                          </p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="hashtags">
                        <div>
                          <h4 className="font-semibold text-indigo-700 mb-2">Recommended Hashtags:</h4>
                          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                            <p className="text-sm leading-relaxed">{generatedContent.hashtags}</p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="export">
                        <ExportOptions content={generatedContent} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
};

export default Dashboard;
