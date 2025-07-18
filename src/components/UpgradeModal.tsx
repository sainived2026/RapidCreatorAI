
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
      title: "10 Content Generations Daily",
      description: "Generate 10 viral content packs per day"
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-4 w-4 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold">$6<span className="text-xs font-normal text-muted-foreground">/month</span></div>
            <Badge className="mt-1" variant="secondary">
              Cancel anytime
            </Badge>
          </div>

          <div className="grid gap-2">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                <div className="text-primary mt-0.5">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-xs">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-tight">{feature.description}</p>
                </div>
                <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-2 rounded-lg">
            <h3 className="font-medium mb-1 text-xs">🚀 Perfect for Content Creators</h3>
            <p className="text-xs text-muted-foreground leading-tight">
              Join thousands of creators who've gone viral with our AI-powered content generation. 
              Start creating professional content that gets views, engagement, and grows your audience.
            </p>
          </div>

          <Button 
            onClick={onUpgrade} 
            className="w-full" 
            size="sm"
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
