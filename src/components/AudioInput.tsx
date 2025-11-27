import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Music } from 'lucide-react';

interface AudioInputProps {
  onUrlSubmit: (url: string) => void;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
}

export const AudioInput: React.FC<AudioInputProps> = ({
  onUrlSubmit,
  isLoading = false,
  error,
  success = false
}) => {
  const [url, setUrl] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onUrlSubmit(url.trim());
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      e.preventDefault();
      onUrlSubmit(url.trim());
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    }
  };

  return (
    <Card className="glass p-6 transition-all hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Audio Source
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative w-full">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a YouTube link and press Enter..."
              disabled={isLoading}
              loading={isLoading}
              error={!!error}
              className="text-lg pr-12 transition-all focus:scale-[1.01]"
              aria-label="YouTube URL input"
              aria-describedby={error ? "url-error" : undefined}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Submit button for better accessibility */}
          <Button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Load audio from URL"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Loading Audio...
              </>
            ) : (
              <>
                <Music />
                Load Audio
              </>
            )}
          </Button>

          {/* Error feedback */}
          {error && showFeedback && (
            <div 
              id="url-error"
              className="p-3 bg-destructive/20 border border-destructive/50 rounded-md text-sm text-destructive animate-fade-in"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success feedback */}
          {success && showFeedback && !error && (
            <div 
              className="p-3 bg-green-500/20 border border-green-500/50 rounded-md text-sm text-green-400 animate-fade-in"
              role="status"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Audio loaded successfully!</span>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
