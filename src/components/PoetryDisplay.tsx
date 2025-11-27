import { useState, useEffect } from 'react';
import type { Poem } from '../types/poetry';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';

interface PoetryDisplayProps {
  poems: Poem[];
  currentPoem?: string;
  isGenerating?: boolean;
  onRegenerate?: () => void;
  regenerationError?: string | null;
}

export const PoetryDisplay: React.FC<PoetryDisplayProps> = ({
  poems,
  currentPoem,
  isGenerating = false,
  onRegenerate,
  regenerationError
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animated text reveal effect
  useEffect(() => {
    if (currentPoem && currentPoem !== displayedText) {
      setIsAnimating(true);
      let currentIndex = 0;
      const text = currentPoem;
      
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, 30); // 30ms per character for smooth animation

      return () => clearInterval(interval);
    }
  }, [currentPoem]);

  const handleCopy = async () => {
    if (displayedText) {
      try {
        await navigator.clipboard.writeText(displayedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

  return (
    <Card className="animate-in fade-in duration-500 p-6 transition-all hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Poetry
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Current/Latest Poem Display */}
        <div className="bg-black/30 rounded-lg p-lg mb-md min-h-[200px] flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-md" />
              <p className="text-base text-gray-400 italic">Generating poetry...</p>
            </div>
          ) : displayedText ? (
            <div className="text-center animate-in fade-in duration-500">
              <p className="text-lg text-white leading-relaxed whitespace-pre-wrap font-serif">
                {displayedText}
                {isAnimating && <span className="animate-pulse">|</span>}
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-sm opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-base italic text-gray-400">Poetry will appear here</p>
            </div>
          )}
        </div>

        {/* Poem History */}
        {poems.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-300 mb-sm flex items-center gap-sm transition-colors hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History ({poems.length})
            </h3>
            <div className="space-y-sm max-h-[300px] overflow-y-auto">
              {poems.slice().reverse().map((poem) => (
                <div
                  key={poem.id}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-md transition-all cursor-pointer group hover:scale-[1.01] hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                  tabIndex={0}
                  role="button"
                  aria-label={`View poem from ${new Date(poem.timestamp).toLocaleTimeString()}`}
                >
                  <div className="flex items-start justify-between gap-sm mb-xs">
                    <span className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
                      {new Date(poem.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-sm text-primary capitalize font-semibold transition-colors group-hover:text-red-400">
                      {poem.style.tone}
                    </span>
                  </div>
                  <p className="text-base text-gray-300 line-clamp-2 group-hover:line-clamp-none transition-all">
                    {poem.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {displayedText && (
        <CardFooter className="p-0 pt-md flex flex-col gap-2">
          {/* Regeneration Error Message */}
          {regenerationError && (
            <div className="w-full bg-red-500/10 border border-red-500/30 rounded-md p-2 text-sm text-red-400 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{regenerationError}</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="w-full flex gap-2">
            {/* Regenerate Button */}
            {onRegenerate && (
              <Button
                variant="default"
                size="sm"
                onClick={onRegenerate}
                disabled={isGenerating}
                className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Regenerate poetry"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </>
                )}
              </Button>
            )}
            
            {/* Copy Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Copy poetry to clipboard"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
