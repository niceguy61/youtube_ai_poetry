import { useState, useEffect } from 'react';
import type { Poem } from '../types/poetry';

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

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Poetry</h2>

      {/* Current/Latest Poem Display */}
      <div className="bg-black/30 rounded-lg p-6 mb-4 min-h-[200px] flex items-center justify-center">
        {isGenerating ? (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 italic">Generating poetry...</p>
          </div>
        ) : displayedText ? (
          <div className="text-center">
            <p className="text-xl text-white leading-relaxed whitespace-pre-wrap font-serif">
              {displayedText}
              {isAnimating && <span className="animate-pulse">|</span>}
            </p>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="italic">Poetry will appear here</p>
          </div>
        )}
      </div>

      {/* Poem History */}
      {poems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
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
                  <span className="text-xs text-gray-400">
                    {new Date(poem.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-purple-400 capitalize">
                    {poem.style.tone}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2 group-hover:line-clamp-none transition-all">
                  {poem.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
