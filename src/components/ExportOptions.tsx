
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, FileText, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExportOptionsProps {
  generatedContent: {
    title: string;
    description: string;
    script: string;
    hashtags: string;
    thumbnailText: string;
    thumbnailDesignIdea: string;
  };
  niche: string;
  format: string;
  style: string;
}

const ExportOptions = ({ generatedContent, niche, format, style }: ExportOptionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadThumbnailIdea = () => {
    const thumbnailContent = `THUMBNAIL DESIGN IDEA
${generatedContent.thumbnailDesignIdea}

THUMBNAIL TEXT
${generatedContent.thumbnailText}

Format: ${format}
Style: ${style}
Niche: ${niche}`;

    const blob = new Blob([thumbnailContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thumbnail-idea-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Thumbnail idea saved as text file",
    });
  };

  const exportFullPack = async (format: 'txt' | 'pdf') => {
    setIsExporting(true);
    try {
      const content = `VIRAL CONTENT PACK
Generated on: ${new Date().toLocaleDateString()}

TITLE: ${generatedContent.title}

DESCRIPTION: ${generatedContent.description}

SCRIPT:
${generatedContent.script}

HASHTAGS: ${generatedContent.hashtags}

THUMBNAIL TEXT: ${generatedContent.thumbnailText}

THUMBNAIL DESIGN IDEA:
${generatedContent.thumbnailDesignIdea}

CONTENT DETAILS:
- Niche: ${niche}
- Format: ${format}
- Style: ${style}`;

      if (format === 'txt') {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `content-pack-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Exported!",
        description: `Content pack exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export content pack",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Options
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(generatedContent.script, "Script")}
            className="flex items-center gap-2"
          >
            <Copy className="h-3 w-3" />
            Copy Script
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadThumbnailIdea}
            className="flex items-center gap-2"
          >
            <Image className="h-3 w-3" />
            Get Thumbnail
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportFullPack('txt')}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileText className="h-3 w-3" />
            Export TXT
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(`${generatedContent.description}\n\n${generatedContent.hashtags}`, "Instagram post")}
            className="flex items-center gap-2"
          >
            <Copy className="h-3 w-3" />
            Copy for IG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportOptions;
