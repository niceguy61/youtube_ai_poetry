import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onReady?: (player: YT.Player) => void;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

// YouTube IFrame API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onReady,
  onStateChange,
  onTimeUpdate,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Load the API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };

    return () => {
      // Cleanup
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !containerRef.current || !videoId) {
      return;
    }

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // Create new player
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          if (onReady) {
            onReady(event.target);
          }

          // Start time update interval
          if (onTimeUpdate) {
            timeUpdateIntervalRef.current = window.setInterval(() => {
              if (playerRef.current && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
                const currentTime = playerRef.current.getCurrentTime();
                onTimeUpdate(currentTime);
              }
            }, 100); // Update every 100ms
          }
        },
        onStateChange: (event) => {
          if (onStateChange) {
            onStateChange(event.data);
          }
        },
        onError: (event) => {
          console.error('[YouTubePlayer] Error:', event.data);
        }
      }
    });

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isAPIReady, videoId, onReady, onStateChange, onTimeUpdate]);

  return (
    <div className={`youtube-player-container ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

// Export player reference hook
export const useYouTubePlayer = () => {
  const playerRef = useRef<YT.Player | null>(null);

  const setPlayer = (player: YT.Player) => {
    playerRef.current = player;
  };

  const play = () => {
    playerRef.current?.playVideo();
  };

  const pause = () => {
    playerRef.current?.pauseVideo();
  };

  const stop = () => {
    playerRef.current?.stopVideo();
  };

  const seekTo = (seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  };

  const setVolume = (volume: number) => {
    playerRef.current?.setVolume(volume * 100); // YouTube uses 0-100
  };

  const getCurrentTime = (): number => {
    return playerRef.current?.getCurrentTime() || 0;
  };

  const getDuration = (): number => {
    return playerRef.current?.getDuration() || 0;
  };

  const getPlayerState = (): number => {
    return playerRef.current?.getPlayerState() || -1;
  };

  return {
    setPlayer,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    getCurrentTime,
    getDuration,
    getPlayerState
  };
};
