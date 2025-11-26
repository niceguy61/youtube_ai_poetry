import { useState, useEffect } from 'react';
import type { Poem } from '../types/poetry';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';

interface PoetryDisplayProps {
  poems: Poem[];
  currentPoem?: string;
  isGenerating?: boolean;
}

export const PoetryDisplay: React.FC<PoetryDisplayProps> = ({
  poems,
  currentPoem,
  isGenerating = false
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
    <Card className="animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Poetry</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Current/Latest Poem Display */}
        <div className="bg-black/30 rounded-lg p-6 mb-4 min-h-[200px] flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
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
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-base italic text-gray-400">Poetry will appear here</p>
            </div>
          )}
        </div>

        {/* Poem History */}
        {poems.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-300 mb-2 flex items-center gap-2 transition-colors hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History ({poems.length})
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {poems.slice().reverse().map((poem) => (
                <div
                  key={poem.id}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm text-gray-400 transition-colors hover:text-gray-300">
                      {new Date(poem.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-sm text-primary capitalize font-semibold transition-colors hover:text-red-400">
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
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="w-full"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Poetry
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
