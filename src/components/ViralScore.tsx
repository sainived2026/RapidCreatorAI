
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Target } from "lucide-react";

interface ViralScoreProps {
  generatedContent: {
    title: string;
    description: string;
    script: string;
    hashtags: string;
  };
  niche: string;
  style: string;
}

const ViralScore = ({ generatedContent, niche, style }: ViralScoreProps) => {
  const [viralScore, setViralScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({
    titleScore: 0,
    scriptScore: 0,
    hashtagScore: 0,
  });

  useEffect(() => {
    calculateViralScore();
  }, [generatedContent]);

  const calculateViralScore = () => {
    let titleScore = 0;
    let scriptScore = 0;
    let hashtagScore = 0;

    // Title scoring (max 35 points)
    const titleWords = generatedContent.title.toLowerCase();
    const viralTitleWords = ['secret', 'shocking', 'you won\'t believe', 'amazing', 'viral', 'mind-blowing', 'insane'];
    viralTitleWords.forEach(word => {
      if (titleWords.includes(word)) titleScore += 5;
    });
    if (generatedContent.title.includes('?') || generatedContent.title.includes('!')) titleScore += 10;
    if (generatedContent.title.length > 30 && generatedContent.title.length < 60) titleScore += 15;

    // Script scoring (max 40 points)
    const scriptWords = generatedContent.script.split(' ').length;
    if (scriptWords >= 40 && scriptWords <= 80) scriptScore += 20;
    const actionWords = ['watch', 'see', 'look', 'check', 'follow', 'like', 'subscribe'];
    actionWords.forEach(word => {
      if (generatedContent.script.toLowerCase().includes(word)) scriptScore += 5;
    });

    // Hashtag scoring (max 25 points)
    const hashtagCount = (generatedContent.hashtags.match(/#/g) || []).length;
    if (hashtagCount >= 3 && hashtagCount <= 8) hashtagScore += 15;
    if (generatedContent.hashtags.toLowerCase().includes('#viral')) hashtagScore += 10;

    const totalScore = Math.min(titleScore + scriptScore + hashtagScore, 100);

    setScoreBreakdown({
      titleScore: Math.min(titleScore, 35),
      scriptScore: Math.min(scriptScore, 40),
      hashtagScore: Math.min(hashtagScore, 25),
    });
    setViralScore(totalScore);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "🔥 Highly Viral";
    if (score >= 60) return "📈 Good Potential";
    if (score >= 40) return "⚡ Moderate";
    return "💡 Needs Work";
  };

  // Mock trending data
  const trendingToday = "Storytelling in Finance";
  const userTopNiche = "Motivation";

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Your Viral Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(viralScore)}`}>
            {viralScore}/100
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {getScoreLabel(viralScore)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Title Hook</span>
            <Badge variant="outline">{scoreBreakdown.titleScore}/35</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Script Engagement</span>
            <Badge variant="outline">{scoreBreakdown.scriptScore}/40</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Hashtag Power</span>
            <Badge variant="outline">{scoreBreakdown.hashtagScore}/25</Badge>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span>Most popular style today: <strong>{trendingToday}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-purple-500" />
            <span>Your top niche: <strong>{userTopNiche}</strong></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ViralScore;
