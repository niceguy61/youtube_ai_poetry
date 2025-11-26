import { useState, useEffect } from 'react';
import type { PlaybackState } from '../types/audio';

interface ControlPanelProps {
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  onGeneratePoetry?: () => void;
  isGeneratingPoetry?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  playbackState,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  volume = 1,
  onVolumeChange,
  onGeneratePoetry,
  isGeneratingPoetry = false
}) => {
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);

  useEffect(() => {
    if (!isDraggingSeek) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDraggingSeek]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setLocalTime(newTime);
  };

  const handleSeekMouseDown = () => {
    setIsDraggingSeek(true);
  };

  const handleSeekMouseUp = () => {
    setIsDraggingSeek(false);
    onSeek(localTime);
  };



  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const hasAudio = duration > 0;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Playback Controls</h2>

      {/* Playback Buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={onStop}
          disabled={!hasAudio || playbackState === 'stopped' || isLoading}
          className="p-2 bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          title="Stop"
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasAudio || isLoading}
          className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-colors shadow-lg"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-300 font-mono min-w-[45px]">
            {formatTime(localTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={localTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            onTouchStart={handleSeekMouseDown}
            onTouchEnd={handleSeekMouseUp}
            disabled={!hasAudio}
            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: hasAudio
                ? `linear-gradient(to right, #9333ea 0%, #9333ea ${(localTime / duration) * 100}%, rgba(255,255,255,0.1) ${(localTime / duration) * 100}%, rgba(255,255,255,0.1) 100%)`
                : 'rgba(255,255,255,0.1)'
            }}
          />
          <span className="text-sm text-gray-300 font-mono min-w-[45px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>



      {/* Generate Poetry Button */}
      {onGeneratePoetry && hasAudio && (
        <div className="mt-4">
          <button
            onClick={onGeneratePoetry}
            disabled={isGeneratingPoetry || !isPlaying}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
            title="Generate new poetry from current audio"
          >
            {isGeneratingPoetry ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Generate Poetry</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mt-4 text-center">
        <span className={`text-sm ${
          playbackState === 'playing' ? 'text-green-400' :
          playbackState === 'paused' ? 'text-yellow-400' :
          playbackState === 'loading' ? 'text-blue-400' :
          playbackState === 'error' ? 'text-red-400' :
          'text-gray-400'
        }`}>
          {playbackState === 'playing' ? '▶ Playing' :
           playbackState === 'paused' ? '⏸ Paused' :
           playbackState === 'loading' ? '⏳ Loading' :
           playbackState === 'stopped' ? '⏹ Stopped' :
           playbackState === 'error' ? '⚠ Error' :
           '○ Ready'}
        </span>
      </div>
    </div>
  );
};
