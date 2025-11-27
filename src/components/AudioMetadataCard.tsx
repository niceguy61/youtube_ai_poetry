/**
 * AudioMetadataCard Component
 * 
 * Displays audio metadata from librosa analysis and yt-dlp extraction
 * Shows key musical characteristics in a card format
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Gauge, Sparkles, Key, Clock } from 'lucide-react';
import type { AudioAnalysisResult } from '../types/audio';

interface AudioMetadataCardProps {
  analysis: AudioAnalysisResult | null;
  videoInfo?: {
    title?: string;
    author?: string;
    duration?: number;
  } | null;
}

export const AudioMetadataCard: React.FC<AudioMetadataCardProps> = ({
  analysis,
  videoInfo,
}) => {
  if (!analysis) {
    return null;
  }

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get mood emoji
  const getMoodEmoji = (mood: string): string => {
    const moodMap: Record<string, string> = {
      'joyful': '😊',
      'energetic': '⚡',
      'calm': '😌',
      'melancholic': '😔',
      'intense': '🔥',
      'peaceful': '☮️',
      'dramatic': '🎭',
      'contemplative': '🤔',
    };
    
    for (const [key, emoji] of Object.entries(moodMap)) {
      if (mood.toLowerCase().includes(key)) {
        return emoji;
      }
    }
    
    return '🎵';
  };

  // Get intensity color
  const getIntensityColor = (intensity: number): string => {
    if (intensity > 0.7) return 'text-red-400';
    if (intensity > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Get complexity color
  const getComplexityColor = (complexity: number): string => {
    if (complexity > 0.7) return 'text-purple-400';
    if (complexity > 0.4) return 'text-blue-400';
    return 'text-cyan-400';
  };

  return (
    <Card className="glass transition-all hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Audio Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Video Info */}
        {videoInfo?.title && (
          <div className="pb-3 border-b border-white/10">
            <p className="text-sm font-medium text-white/90 line-clamp-2">
              {videoInfo.title}
            </p>
            {videoInfo.author && (
              <p className="text-xs text-gray-400 mt-1">
                {videoInfo.author}
              </p>
            )}
          </div>
        )}

        {/* Musical Characteristics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tempo */}
          <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-400">Tempo</span>
            </div>
            <p className="text-lg font-bold text-white">
              {Math.round(analysis.tempo)} <span className="text-sm text-gray-400">BPM</span>
            </p>
          </div>

          {/* Key */}
          <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Key className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">Key</span>
            </div>
            <p className="text-lg font-bold text-white">
              {analysis.key}
            </p>
          </div>

          {/* Energy */}
          <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Energy</span>
            </div>
            <p className="text-lg font-bold text-white">
              {(analysis.energy * 100).toFixed(0)}<span className="text-sm text-gray-400">%</span>
            </p>
            <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
                style={{ width: `${analysis.energy * 100}%` }}
              />
            </div>
          </div>

          {/* Valence (Positivity) */}
          <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-pink-400" />
              <span className="text-xs text-gray-400">Valence</span>
            </div>
            <p className="text-lg font-bold text-white">
              {(analysis.valence * 100).toFixed(0)}<span className="text-sm text-gray-400">%</span>
            </p>
            <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all"
                style={{ width: `${analysis.valence * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mood, Intensity, Complexity */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          {/* Mood */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Mood</span>
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <span>{getMoodEmoji(analysis.mood)}</span>
              <span className="capitalize">{analysis.mood}</span>
            </span>
          </div>

          {/* Intensity */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Intensity</span>
            <span className={`text-sm font-medium ${getIntensityColor(analysis.intensity)}`}>
              {(analysis.intensity * 100).toFixed(0)}%
            </span>
          </div>

          {/* Complexity */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Complexity</span>
            <span className={`text-sm font-medium ${getComplexityColor(analysis.complexity)}`}>
              {(analysis.complexity * 100).toFixed(0)}%
            </span>
          </div>

          {/* Duration */}
          {analysis.duration && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Duration
              </span>
              <span className="text-sm font-medium text-white">
                {formatDuration(analysis.duration)}
              </span>
            </div>
          )}
        </div>

        {/* Technical Details (Collapsible) */}
        <details className="pt-2 border-t border-white/10">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
            Technical Details
          </summary>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Spectral Centroid</span>
              <span className="text-gray-400">{analysis.spectral_centroid.toFixed(2)} Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Spectral Rolloff</span>
              <span className="text-gray-400">{analysis.spectral_rolloff.toFixed(2)} Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Zero Crossing Rate</span>
              <span className="text-gray-400">{analysis.zero_crossing_rate.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Energy Variance</span>
              <span className="text-gray-400">{analysis.energy_variance.toFixed(4)}</span>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};
