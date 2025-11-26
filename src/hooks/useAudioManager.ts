/**
 * useAudioManager Hook
 * 
 * Custom React hook for managing audio state and playback.
 * Provides a clean interface to the AudioManager core class.
 * 
 * Requirements: All UI-related audio requirements (1.1, 1.2, 1.3, 1.6)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioManager } from '../core/AudioManager';
import type { AudioSource, PlaybackState } from '../types/audio';

export interface UseAudioManagerReturn {
  // State
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  currentSource: AudioSource | null;
  isPlaying: boolean;
  error: string | null;

  // Actions
  loadFromFile: (file: File) => Promise<void>;
  loadFromURL: (url: string) => Promise<void>;
  loadFromYouTube: (url: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;

  // Manager instance (for advanced use cases)
  audioManager: AudioManager | null;
}

/**
 * Hook for managing audio playback and state
 * 
 * @returns Audio manager state and control functions
 */
export function useAudioManager(): UseAudioManagerReturn {
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSource, setCurrentSource] = useState<AudioSource | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize AudioManager on mount
  useEffect(() => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager();
    }

    const manager = audioManagerRef.current;

    // Subscribe to playback state changes
    const unsubscribeState = manager.onPlaybackStateChange((state) => {
      setPlaybackState(state);
      
      // Clear error when state changes to non-error
      if (state !== 'error') {
        setError(null);
      }
    });

    // Subscribe to time updates
    const unsubscribeTime = manager.onTimeUpdate((time) => {
      setCurrentTime(time);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeState();
      unsubscribeTime();
      manager.dispose();
      audioManagerRef.current = null;
    };
  }, []);

  // Load audio from file
  const loadFromFile = useCallback(async (file: File) => {
    if (!audioManagerRef.current) return;

    try {
      setError(null);
      const source = await audioManagerRef.current.loadFromFile(file);
      setCurrentSource(source);
      setDuration(source.duration);
      setCurrentTime(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio file';
      setError(errorMessage);
      console.error('[useAudioManager] Load file error:', err);
    }
  }, []);

  // Load audio from URL
  const loadFromURL = useCallback(async (url: string) => {
    if (!audioManagerRef.current) return;

    try {
      setError(null);
      const source = await audioManagerRef.current.loadFromURL(url);
      setCurrentSource(source);
      setDuration(source.duration);
      setCurrentTime(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio from URL';
      setError(errorMessage);
      console.error('[useAudioManager] Load URL error:', err);
    }
  }, []);

  // Load audio from YouTube
  const loadFromYouTube = useCallback(async (url: string) => {
    if (!audioManagerRef.current) return;

    try {
      setError(null);
      const source = await audioManagerRef.current.loadFromYouTube(url);
      setCurrentSource(source);
      setDuration(source.duration);
      setCurrentTime(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio from YouTube';
      setError(errorMessage);
      console.error('[useAudioManager] Load YouTube error:', err);
    }
  }, []);

  // Play audio
  const play = useCallback(() => {
    if (!audioManagerRef.current) return;

    try {
      audioManagerRef.current.play();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      setError(errorMessage);
      console.error('[useAudioManager] Play error:', err);
    }
  }, []);

  // Pause audio
  const pause = useCallback(() => {
    if (!audioManagerRef.current) return;

    try {
      audioManagerRef.current.pause();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause audio';
      setError(errorMessage);
      console.error('[useAudioManager] Pause error:', err);
    }
  }, []);

  // Stop audio
  const stop = useCallback(() => {
    if (!audioManagerRef.current) return;

    try {
      audioManagerRef.current.stop();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop audio';
      setError(errorMessage);
      console.error('[useAudioManager] Stop error:', err);
    }
  }, []);

  // Seek to time
  const seek = useCallback((time: number) => {
    if (!audioManagerRef.current) return;

    try {
      audioManagerRef.current.seek(time);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to seek';
      setError(errorMessage);
      console.error('[useAudioManager] Seek error:', err);
    }
  }, []);

  return {
    // State
    playbackState,
    currentTime,
    duration,
    currentSource,
    isPlaying: playbackState === 'playing',
    error,

    // Actions
    loadFromFile,
    loadFromURL,
    loadFromYouTube,
    play,
    pause,
    stop,
    seek,

    // Manager instance
    audioManager: audioManagerRef.current,
  };
}
