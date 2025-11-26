import { useRef, useEffect, useState } from 'react';
import type { InteractionEvent } from '../types/canvas';

interface InteractiveCanvasProps {
  onInteraction: (event: InteractionEvent) => void;
  isEnabled?: boolean;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  onInteraction,
  isEnabled = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || e.changedTouches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEnabled) return;

    const position = getCanvasCoordinates(e);
    onInteraction({
      type: 'click',
      position,
      timestamp: Date.now()
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEnabled) return;

    const position = getCanvasCoordinates(e);
    setIsDragging(true);
    setLastPosition(position);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEnabled || !isDragging) return;

    const position = getCanvasCoordinates(e);
    
    if (lastPosition) {
      onInteraction({
        type: 'drag',
        position,
        timestamp: Date.now()
      });
    }
    
    setLastPosition(position);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastPosition(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setLastPosition(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isEnabled) return;
    e.preventDefault();

    const position = getCanvasCoordinates(e);
    setIsDragging(true);
    setLastPosition(position);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isEnabled || !isDragging) return;
    e.preventDefault();

    const position = getCanvasCoordinates(e);
    
    if (lastPosition) {
      onInteraction({
        type: 'drag',
        position,
        timestamp: Date.now()
      });
    }
    
    setLastPosition(position);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setLastPosition(null);
  };

  const handleHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEnabled || isDragging) return;

    const position = getCanvasCoordinates(e);
    onInteraction({
      type: 'hover',
      position,
      timestamp: Date.now()
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent default touch behaviors
    const preventDefaultTouch = (e: TouchEvent) => {
      if (isEnabled) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultTouch);
      canvas.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, [isEnabled]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Interactive Canvas</h2>
        <div className={`text-sm ${isEnabled ? 'text-green-400' : 'text-gray-400'}`}>
          {isEnabled ? '✓ Interactive' : '○ Disabled'}
        </div>
      </div>

      <div className="relative bg-black/50 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={handleHover}
          className={`w-full h-full ${isEnabled ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          style={{ touchAction: 'none' }}
        />
        
        {!isEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-gray-400">Load audio to enable interactions</p>
          </div>
        )}

        {isEnabled && (
          <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-black/50 px-3 py-2 rounded">
            Click or drag to interact with the canvas
          </div>
        )}
      </div>
    </div>
  );
};
