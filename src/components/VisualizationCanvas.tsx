import { useEffect, useRef } from 'react';
import type { VisualizationMode } from '../types/visualization';

interface VisualizationCanvasProps {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  isPlaying?: boolean;
}

const VISUALIZATION_MODES: { value: VisualizationMode; label: string; icon: string }[] = [
  { value: 'gradient', label: 'Gradient', icon: '🌈' },
  { value: 'equalizer', label: 'Equalizer', icon: '📊' },
  { value: 'spotlight', label: 'Spotlight', icon: '💡' },
  { value: 'ai-image', label: 'AI Image', icon: '🎨' },
  { value: 'combined', label: 'Combined', icon: '✨' },
];

export const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  mode,
  onModeChange,
  onCanvasReady,
  isPlaying = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    } else {
      console.warn('[VisualizationCanvas] Canvas ref is null!');
    }
  }, [onCanvasReady]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Visualization</h2>
        {isPlaying && (
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">Live</span>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {VISUALIZATION_MODES.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => onModeChange(modeOption.value)}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg whitespace-nowrap transition-colors ${
              mode === modeOption.value
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span>{modeOption.icon}</span>
            <span className="text-sm">{modeOption.label}</span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div 
        className="relative bg-black/50 rounded-lg overflow-hidden" 
        style={{ 
          aspectRatio: '16/9'
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={1920}
          height={1080}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Load audio to start visualization</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
