import { useState, useEffect } from 'react';
import type { PlaybackState } from '../types/audio';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Play, Pause, Square, Sparkles, CirclePlay, CirclePause, CircleStop, Loader2, AlertCircle, Circle } from 'lucide-react';

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

  const handleSeekChange = (value: number[]) => {
    const newTime = value[0];
    setLocalTime(newTime);
  };

  const handleSeekMouseDown = () => {
    setIsDraggingSeek(true);
  };

  const handleSeekMouseUp = () => {
    setIsDraggingSeek(false);
    onSeek(localTime);
  };

  const handleSeekCommit = (value: number[]) => {
    setIsDraggingSeek(false);
    onSeek(value[0]);
  };



  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const hasAudio = duration > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Playback Controls</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Playback Buttons */}
        <div className="flex items-center justify-center gap-4 mb-6">
        <Button
          onClick={onStop}
          disabled={!hasAudio || playbackState === 'stopped' || isLoading}
          variant="outline"
          size="icon"
          title="Stop"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasAudio || isLoading}
          variant="default"
          size="lg"
          className="rounded-full"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-300 font-mono min-w-[45px] transition-colors hover:text-white">
            {formatTime(localTime)}
          </span>
          <Slider
            min={0}
            max={duration || 1}
            step={0.1}
            value={[localTime]}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekCommit}
            onPointerDown={handleSeekMouseDown}
            onPointerUp={handleSeekMouseUp}
            disabled={!hasAudio}
            className="flex-1"
          />
          <span className="text-sm text-gray-300 font-mono min-w-[45px] transition-colors hover:text-white">
            {formatTime(duration)}
          </span>
        </div>
      </div>



      {/* Generate Poetry Button */}
      {onGeneratePoetry && hasAudio && (
        <div className="mt-4">
          <Button
            onClick={onGeneratePoetry}
            disabled={isGeneratingPoetry || !isPlaying}
            variant="secondary"
            className="w-full"
            title="Generate new poetry from current audio"
          >
            {isGeneratingPoetry ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Poetry</span>
              </>
            )}
          </Button>
        </div>
      )}

        {/* Status Indicator */}
        <div className="mt-4 flex justify-center">
          {playbackState === 'playing' && (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 transition-colors duration-300">
              <CirclePlay className="h-3 w-3 mr-1" />
              Playing
            </Badge>
          )}
          {playbackState === 'paused' && (
            <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 transition-colors duration-300">
              <CirclePause className="h-3 w-3 mr-1" />
              Paused
            </Badge>
          )}
          {playbackState === 'stopped' && (
            <Badge variant="outline" className="transition-colors duration-300">
              <CircleStop className="h-3 w-3 mr-1" />
              Stopped
            </Badge>
          )}
          {playbackState === 'loading' && (
            <Badge variant="secondary" className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Loading
            </Badge>
          )}
          {playbackState === 'error' && (
            <Badge variant="destructive" className="transition-colors duration-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          )}
          {!playbackState && (
            <Badge variant="outline" className="transition-colors duration-300">
              <Circle className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
