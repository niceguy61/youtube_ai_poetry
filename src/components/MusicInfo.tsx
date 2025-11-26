import { useState } from 'react';

interface MusicInfoProps {
  videoTitle: string;
  videoAuthor?: string;
  videoDuration?: number;
}

export const MusicInfo: React.FC<MusicInfoProps> = ({ 
  videoTitle, 
  videoAuthor,
  videoDuration 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoTitle) return null;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-semibold text-white">Track Information</h3>
        <svg
          className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Title</p>
                <p className="text-sm text-white font-medium">{videoTitle}</p>
              </div>
            </div>

            {videoAuthor && (
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Artist</p>
                  <p className="text-sm text-white">{videoAuthor}</p>
                </div>
              </div>
            )}

            {videoDuration && (
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="text-sm text-white">{formatDuration(videoDuration)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
