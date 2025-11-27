/**
 * useOllamaModels Hook
 * 
 * Custom React hook for fetching and managing Ollama model list.
 * Provides model list with loading and error states, with caching to avoid repeated fetches.
 * 
 * Requirements: 4.1, 4.4
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface OllamaModel {
  name: string;
  size: number;
  modified: string;
  digest: string;
}

export interface UseOllamaModelsReturn {
  // State
  models: OllamaModel[];
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;

  // Actions
  fetchModels: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Hook for fetching and managing Ollama models
 * 
 * @param autoFetch - Whether to automatically fetch models on mount (default: true)
 * @returns Ollama models state and control functions
 */
export function useOllamaModels(autoFetch: boolean = true): UseOllamaModelsReturn {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // Cache to avoid repeated fetches
  const cacheRef = useRef<{
    models: OllamaModel[] | null;
    timestamp: number | null;
  }>({
    models: null,
    timestamp: null,
  });

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Fetch models from backend
  const fetchModels = useCallback(async () => {
    // Check cache first
    const now = Date.now();
    if (
      cacheRef.current.models &&
      cacheRef.current.timestamp &&
      now - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      console.log('[useOllamaModels] Using cached models');
      setModels(cacheRef.current.models);
      setIsAvailable(true);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const backendUrl = import.meta.env.VITE_YOUTUBE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/ollama/models`);

      if (!response.ok) {
        if (response.status === 503) {
          // Ollama service unavailable
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Ollama service is unavailable. Please ensure Ollama is running.');
        }
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.models)) {
        throw new Error('Invalid response format from server');
      }

      // Update cache
      cacheRef.current = {
        models: data.models,
        timestamp: now,
      };

      setModels(data.models);
      setIsAvailable(true);
      console.log(`[useOllamaModels] Fetched ${data.models.length} models`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Ollama models';
      setError(errorMessage);
      setIsAvailable(false);
      setModels([]);
      console.error('[useOllamaModels] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = {
      models: null,
      timestamp: null,
    };
    console.log('[useOllamaModels] Cache cleared');
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchModels();
    }
  }, [autoFetch, fetchModels]);

  return {
    // State
    models,
    isLoading,
    error,
    isAvailable,

    // Actions
    fetchModels,
    clearCache,
  };
}
