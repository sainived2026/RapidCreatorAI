
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Video, Image, History, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  onUpgrade: () => void;
  children: React.ReactNode;
}

const UpgradeModal = ({ onUpgrade, children }: UpgradeModalProps) => {
  const proFeatures = [
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Unlimited Content Generation",
      description: "Generate as many viral content packs as you need"
    },
    {
      icon: <Video className="h-4 w-4" />,
      title: "AI Video Scripts",
      description: "Get detailed video production guidance"
    },
    {
      icon: <Image className="h-4 w-4" />,
      title: "HD Thumbnail Designs",
      description: "Professional thumbnail concepts and mockups"
    },
    {
      icon: <History className="h-4 w-4" />,
      title: "Complete Content History",
      description: "Save and access all your generated content"
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Advanced AI Models",
      description: "Access to latest and most powerful AI models"
    },
    {
      icon: <Crown className="h-4 w-4" />,
      title: "Priority Support",
      description: "Get help faster with premium support"
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold">$6<span className="text-lg font-normal text-muted-foreground">/month</span></div>
            <Badge className="mt-2" variant="secondary">
              Cancel anytime
            </Badge>
          </div>

          <div className="grid gap-4">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="text-primary mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="h-4 w-4 text-green-500 mt-0.5 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🚀 Perfect for Content Creators</h3>
            <p className="text-sm text-muted-foreground">
              Join thousands of creators who've gone viral with our AI-powered content generation. 
              Start creating professional content that gets views, engagement, and grows your audience.
            </p>
          </div>

          <Button 
            onClick={onUpgrade} 
            className="w-full" 
            size="lg"
          >
            <Crown className="h-4 w-4 mr-2" />
            Start Pro Plan - $6/month
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
