import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Download, Image, Archive, Link, Loader2 } from 'lucide-react';

interface ExportPanelProps {
  onExportPoetry: (format: 'txt' | 'json' | 'markdown') => void;
  onExportCanvas: (format: 'png' | 'jpg') => void;
  onExportExperience: () => void;
  onGenerateShareURL: () => void;
  hasPoetry?: boolean;
  hasCanvas?: boolean;
  isExporting?: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  onExportPoetry,
  onExportCanvas,
  onExportExperience,
  onGenerateShareURL,
  hasPoetry = false,
  hasCanvas = false,
  isExporting = false
}) => {
  const [poetryFormat, setPoetryFormat] = useState<'txt' | 'json' | 'markdown'>('txt');
  const [canvasFormat, setCanvasFormat] = useState<'png' | 'jpg'>('png');
  const [showShareURL, setShowShareURL] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const showSuccessFeedback = (message: string) => {
    setExportSuccess(message);
    setExportError(null);
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const showErrorFeedback = (message: string) => {
    setExportError(message);
    setExportSuccess(null);
    setTimeout(() => setExportError(null), 3000);
  };

  const handleExportPoetry = () => {
    try {
      onExportPoetry(poetryFormat);
      showSuccessFeedback(`Poetry exported as ${poetryFormat.toUpperCase()}`);
    } catch (error) {
      showErrorFeedback('Failed to export poetry');
    }
  };

  const handleExportCanvas = () => {
    try {
      onExportCanvas(canvasFormat);
      showSuccessFeedback(`Canvas exported as ${canvasFormat.toUpperCase()}`);
    } catch (error) {
      showErrorFeedback('Failed to export canvas');
    }
  };

  const handleExportExperience = () => {
    try {
      onExportExperience();
      showSuccessFeedback('Complete experience exported');
    } catch (error) {
      showErrorFeedback('Failed to export experience');
    }
  };

  const handleGenerateShareURL = () => {
    try {
      onGenerateShareURL();
      setShowShareURL(true);
      showSuccessFeedback('Share URL copied to clipboard');
      setTimeout(() => setShowShareURL(false), 3000);
    } catch (error) {
      showErrorFeedback('Failed to generate share URL');
    }
  };

  return (
    <Card className="glass p-6 transition-all hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export & Share
        </CardTitle>
      </CardHeader>

      {/* Global feedback messages */}
      {exportSuccess && (
        <div 
          className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-md text-sm text-green-400 animate-fade-in"
          role="status"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{exportSuccess}</span>
          </div>
        </div>
      )}

      {exportError && (
        <div 
          className="mb-4 p-3 bg-destructive/20 border border-destructive/50 rounded-md text-sm text-destructive animate-fade-in"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{exportError}</span>
          </div>
        </div>
      )}

      {/* Export Poetry */}
      <CardContent className="p-0 space-y-lg">
        <div>
          <h3 className="text-base font-semibold text-gray-300 mb-sm flex items-center gap-sm transition-colors hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Export Poetry
          </h3>
          <ToggleGroup 
            type="single" 
            value={poetryFormat} 
            onValueChange={(value) => value && setPoetryFormat(value as 'txt' | 'json' | 'markdown')}
            className="mb-sm justify-start"
            aria-label="Select poetry export format"
          >
            <ToggleGroupItem 
              value="txt" 
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Export as text file"
            >
              .txt
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="json"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Export as JSON file"
            >
              .json
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="markdown"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Export as Markdown file"
            >
              .markdown
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={handleExportPoetry}
            disabled={!hasPoetry || isExporting}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            variant="default"
            aria-label={`Export poetry as ${poetryFormat}`}
          >
            {isExporting ? (
              <>
                <Loader2 className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download />
                Download Poetry
              </>
            )}
          </Button>
        </div>

        {/* Export Canvas */}
        <div>
          <h3 className="text-base font-semibold text-gray-300 mb-sm flex items-center gap-sm transition-colors hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Export Canvas
          </h3>
          <ToggleGroup 
            type="single" 
            value={canvasFormat} 
            onValueChange={(value) => value && setCanvasFormat(value as 'png' | 'jpg')}
            className="mb-sm justify-start"
            aria-label="Select canvas export format"
          >
            <ToggleGroupItem 
              value="png"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Export as PNG image"
            >
              .png
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="jpg"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Export as JPG image"
            >
              .jpg
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={handleExportCanvas}
            disabled={!hasCanvas || isExporting}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            variant="default"
            aria-label={`Export canvas as ${canvasFormat}`}
          >
            {isExporting ? (
              <>
                <Loader2 className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Image />
                Download Image
              </>
            )}
          </Button>
        </div>

        {/* Export Complete Experience */}
        <div>
          <h3 className="text-base font-semibold text-gray-300 mb-sm flex items-center gap-sm transition-colors hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Complete Experience
          </h3>
          <Button
            onClick={handleExportExperience}
            disabled={!hasPoetry && !hasCanvas || isExporting}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            variant="secondary"
            aria-label="Export complete experience"
          >
            <Archive />
            Export All Data
          </Button>
        </div>

        {/* Share URL */}
        <div>
          <h3 className="text-base font-semibold text-gray-300 mb-sm flex items-center gap-sm transition-colors hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Experience
          </h3>
          <Button
            onClick={handleGenerateShareURL}
            disabled={!hasPoetry && !hasCanvas || isExporting}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            variant="secondary"
            aria-label="Generate shareable link"
          >
            <Link />
            Generate Share Link
          </Button>
        </div>

        {/* Info */}
        {!hasPoetry && !hasCanvas && (
          <div className="p-md bg-yellow-500/10 border border-yellow-500/30 rounded">
            <p className="text-sm text-yellow-400 text-center">
              Create poetry and visualizations to enable export
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
