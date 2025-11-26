/**
 * usePoetryGenerator Hook
 * 
 * Custom React hook for managing poetry generation state.
 * Provides a clean interface to the PoetryGenerator service.
 * 
 * Requirements: All UI-related poetry requirements (3.1, 3.2, 3.3, 3.5)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PoetryGenerator } from '../services/PoetryGenerator';
import type { AudioFeatures } from '../types/audio';
import type { InteractionData } from '../types/canvas';
import type { AIProvider, PoetryStyle, Poem } from '../types/poetry';

export interface UsePoetryGeneratorReturn {
  // State
  currentPoem: string | null;
  poems: Poem[];
  isGenerating: boolean;
  currentStyle: PoetryStyle;
  error: string | null;

  // Actions
  generateFromAudio: (features: AudioFeatures) => Promise<void>;
  generateFromMood: (mood: string) => Promise<void>;
  generateFromInteraction: (interaction: InteractionData, audioFeatures?: AudioFeatures) => Promise<void>;
  generateStream: (features: AudioFeatures, onChunk: (chunk: string) => void) => Promise<void>;
  setStyle: (style: PoetryStyle) => void;
  setProvider: (provider: AIProvider) => Promise<void>;
  clearPoems: () => void;

  // Generator instance (for advanced use cases)
  poetryGenerator: PoetryGenerator | null;
}

/**
 * Hook for managing poetry generation and state
 * 
 * @param initialProvider - Optional initial AI provider
 * @returns Poetry generator state and control functions
 */
export function usePoetryGenerator(initialProvider?: AIProvider): UsePoetryGeneratorReturn {
  const generatorRef = useRef<PoetryGenerator | null>(null);
  
  const [currentPoem, setCurrentPoem] = useState<string | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStyle, setCurrentStyleState] = useState<PoetryStyle>({
    tone: 'calm',
    length: 'medium',
    structure: 'free-verse',
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize PoetryGenerator on mount
  useEffect(() => {
    if (!generatorRef.current) {
      generatorRef.current = new PoetryGenerator(initialProvider);
      
      // Initialize asynchronously
      generatorRef.current.initialize(initialProvider).catch((err) => {
        console.error('[usePoetryGenerator] Initialization error:', err);
      });
    }

    // Cleanup on unmount
    return () => {
      generatorRef.current = null;
    };
  }, [initialProvider]);

  // Sync poems from generator
  const syncPoems = useCallback(() => {
    if (generatorRef.current) {
      setPoems(generatorRef.current.getGeneratedPoems());
    }
  }, []);

  // Generate poetry from audio features
  const generateFromAudio = useCallback(async (features: AudioFeatures) => {
    if (!generatorRef.current) return;

    try {
      setIsGenerating(true);
      setError(null);
      
      const poetry = await generatorRef.current.generateFromAudio(features);
      setCurrentPoem(poetry);
      syncPoems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate poetry from audio';
      setError(errorMessage);
      console.error('[usePoetryGenerator] Generate from audio error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [syncPoems]);

  // Generate poetry from mood
  const generateFromMood = useCallback(async (mood: string) => {
    if (!generatorRef.current) return;

    try {
      setIsGenerating(true);
      setError(null);
      
      const poetry = await generatorRef.current.generateFromMood(mood);
      setCurrentPoem(poetry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate poetry from mood';
      setError(errorMessage);
      console.error('[usePoetryGenerator] Generate from mood error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate poetry from interaction
  const generateFromInteraction = useCallback(async (
    interaction: InteractionData,
    audioFeatures?: AudioFeatures
  ) => {
    if (!generatorRef.current) return;

    try {
      setIsGenerating(true);
      setError(null);
      
      const poetry = await generatorRef.current.generateFromInteraction(interaction, audioFeatures);
      setCurrentPoem(poetry);
      syncPoems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate poetry from interaction';
      setError(errorMessage);
      console.error('[usePoetryGenerator] Generate from interaction error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [syncPoems]);

  // Generate poetry with streaming
  const generateStream = useCallback(async (
    features: AudioFeatures,
    onChunk: (chunk: string) => void
  ) => {
    if (!generatorRef.current) return;

    try {
      setIsGenerating(true);
      setError(null);
      setCurrentPoem(''); // Clear current poem for streaming
      
      let fullPoem = '';
      
      await generatorRef.current.generateStream(features, (chunk: string) => {
        fullPoem += chunk;
        setCurrentPoem(fullPoem);
        onChunk(chunk);
      });
      
      syncPoems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stream poetry generation';
      setError(errorMessage);
      console.error('[usePoetryGenerator] Stream generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [syncPoems]);

  // Set poetry style
  const setStyle = useCallback((style: PoetryStyle) => {
    if (!generatorRef.current) return;

    try {
      generatorRef.current.setStyle(style);
      setCurrentStyleState(style);
    } catch (err) {
      console.error('[usePoetryGenerator] Set style error:', err);
    }
  }, []);

  // Set AI provider
  const setProvider = useCallback(async (provider: AIProvider) => {
    if (!generatorRef.current) return;

    try {
      await generatorRef.current.setProvider(provider);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set AI provider';
      setError(errorMessage);
      console.error('[usePoetryGenerator] Set provider error:', err);
    }
  }, []);

  // Clear all poems
  const clearPoems = useCallback(() => {
    if (!generatorRef.current) return;

    try {
      generatorRef.current.clearPoems();
      setPoems([]);
      setCurrentPoem(null);
    } catch (err) {
      console.error('[usePoetryGenerator] Clear poems error:', err);
    }
  }, []);

  return {
    // State
    currentPoem,
    poems,
    isGenerating,
    currentStyle,
    error,

    // Actions
    generateFromAudio,
    generateFromMood,
    generateFromInteraction,
    generateStream,
    setStyle,
    setProvider,
    clearPoems,

    // Generator instance
    poetryGenerator: generatorRef.current,
  };
}
