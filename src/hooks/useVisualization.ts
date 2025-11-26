/**
 * useVisualization Hook
 * 
 * Custom React hook for managing visualization state and rendering.
 * Provides a clean interface to the VisualizationEngine core class.
 * 
 * Requirements: All UI-related visualization requirements (2.1, 2.3, 12.6)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VisualizationEngine } from '../core/VisualizationEngine';
import type {
  VisualizationMode,
  VisualizationLayer,
  VisualizationConfig,
} from '../types/visualization';
import type { AudioData } from '../types/audio';

export interface UseVisualizationReturn {
  // State
  currentMode: VisualizationMode;
  enabledLayers: VisualizationLayer[];
  isRendering: boolean;
  isInitialized: boolean;
  config: VisualizationConfig | null;

  // Actions
  initialize: (canvas: HTMLCanvasElement) => void;
  setMode: (mode: VisualizationMode) => void;
  enableLayer: (layer: VisualizationLayer) => void;
  disableLayer: (layer: VisualizationLayer) => void;
  setConfig: (config: Partial<VisualizationConfig>) => void;
  setBackgroundImage: (imageUrl: string | undefined) => Promise<void>;
  applyAIConfig: (aiConfig: any) => void;
  startRendering: () => void;
  stopRendering: () => void;
  updateAudioData: (audioData: AudioData) => void;

  // Engine instance (for advanced use cases)
  visualizationEngine: VisualizationEngine | null;
}

/**
 * Hook for managing visualization rendering and state
 * 
 * @returns Visualization engine state and control functions
 */
export function useVisualization(): UseVisualizationReturn {
  const engineRef = useRef<VisualizationEngine | null>(null);
  
  const [currentMode, setCurrentMode] = useState<VisualizationMode>('gradient');
  const [enabledLayers, setEnabledLayers] = useState<VisualizationLayer[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfigState] = useState<VisualizationConfig | null>(null);

  // Initialize VisualizationEngine on mount
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new VisualizationEngine();
    }

    // Cleanup on unmount - but don't set ref to null (React Strict Mode issue)
    return () => {
      // Don't cleanup here - let it persist across strict mode double-invocation
      // Actual cleanup will happen when component truly unmounts
    };
  }, []);

  // Initialize with canvas
  const initialize = useCallback((canvas: HTMLCanvasElement) => {
    if (!engineRef.current) {
      console.error('[useVisualization] No engine ref!');
      return;
    }

    try {
      engineRef.current.initialize(canvas);
      setIsInitialized(true);
      
      // Get initial state
      setCurrentMode(engineRef.current.getCurrentMode());
      setEnabledLayers(engineRef.current.getEnabledLayers());
      setConfigState(engineRef.current.getConfig());
    } catch (err) {
      console.error('[useVisualization] Initialization error:', err);
    }
  }, []);

  // Set visualization mode
  const setMode = useCallback((mode: VisualizationMode) => {
    if (!engineRef.current || !isInitialized) return;

    try {
      engineRef.current.setMode(mode);
      setCurrentMode(mode);
      setEnabledLayers(engineRef.current.getEnabledLayers());
    } catch (err) {
      console.error('[useVisualization] Set mode error:', err);
    }
  }, [isInitialized]);

  // Enable a layer
  const enableLayer = useCallback((layer: VisualizationLayer) => {
    if (!engineRef.current || !isInitialized) return;

    try {
      engineRef.current.enableLayer(layer);
      setEnabledLayers(engineRef.current.getEnabledLayers());
    } catch (err) {
      console.error('[useVisualization] Enable layer error:', err);
    }
  }, [isInitialized]);

  // Disable a layer
  const disableLayer = useCallback((layer: VisualizationLayer) => {
    if (!engineRef.current || !isInitialized) return;

    try {
      engineRef.current.disableLayer(layer);
      setEnabledLayers(engineRef.current.getEnabledLayers());
    } catch (err) {
      console.error('[useVisualization] Disable layer error:', err);
    }
  }, [isInitialized]);

  // Set configuration
  const setConfig = useCallback((newConfig: Partial<VisualizationConfig>) => {
    if (!engineRef.current || !isInitialized) return;

    try {
      engineRef.current.setConfig(newConfig);
      setConfigState(engineRef.current.getConfig());
    } catch (err) {
      console.error('[useVisualization] Set config error:', err);
    }
  }, [isInitialized]);

  // Start rendering
  const startRendering = useCallback(() => {
    if (!engineRef.current || !isInitialized) return;

    try {
      engineRef.current.startRendering();
      setIsRendering(true);
    } catch (err) {
      console.error('[useVisualization] Start rendering error:', err);
    }
  }, [isInitialized]);

  // Stop rendering
  const stopRendering = useCallback(() => {
    if (!engineRef.current) return;

    try {
      engineRef.current.stopRendering();
      setIsRendering(false);
    } catch (err) {
      console.error('[useVisualization] Stop rendering error:', err);
    }
  }, []);

  // Update audio data for rendering
  const updateAudioData = useCallback((audioData: AudioData) => {
    if (!engineRef.current || !isInitialized) return;

    try {
      engineRef.current.updateAudioData(audioData);
    } catch (err) {
      console.error('[useVisualization] Update audio data error:', err);
    }
  }, [isInitialized]);

  // Set background image
  const setBackgroundImage = useCallback(async (imageUrl: string | undefined) => {
    if (!engineRef.current || !isInitialized) return;

    try {
      await engineRef.current.setBackgroundImage(imageUrl);
    } catch (err) {
      console.error('[useVisualization] Set background image error:', err);
    }
  }, [isInitialized]);

  // Apply AI-generated configuration
  const applyAIConfig = useCallback((aiConfig: any) => {
    if (!engineRef.current) {
      console.warn('[useVisualization] Cannot apply AI config: engine not initialized');
      return;
    }

    try {
      engineRef.current.applyAIConfig(aiConfig);
    } catch (error) {
      console.error('[useVisualization] Failed to apply AI config:', error);
    }
  }, []);

  return {
    // State
    currentMode,
    enabledLayers,
    isRendering,
    isInitialized,
    config,

    // Actions
    initialize,
    setMode,
    enableLayer,
    disableLayer,
    setConfig,
    setBackgroundImage,
    applyAIConfig,
    startRendering,
    stopRendering,
    updateAudioData,

    // Engine instance
    visualizationEngine: engineRef.current,
  };
}
