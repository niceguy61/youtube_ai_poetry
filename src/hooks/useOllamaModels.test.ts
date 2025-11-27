/**
 * Tests for useOllamaModels Hook
 * 
 * Validates model fetching, caching, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOllamaModels } from './useOllamaModels';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

describe('useOllamaModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useOllamaModels(false));

    expect(result.current.models).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isAvailable).toBe(true);
  });

  it('should fetch models successfully', async () => {
    const mockModels = [
      { name: 'gemma3:4b', size: 4000000000, modified: '2024-01-01', digest: 'abc123' },
      { name: 'llama2:7b', size: 7000000000, modified: '2024-01-02', digest: 'def456' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, models: mockModels }),
    });

    const { result } = renderHook(() => useOllamaModels(false));

    // Manually trigger fetch
    await act(async () => {
      await result.current.fetchModels();
    });

    expect(result.current.models).toEqual(mockModels);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isAvailable).toBe(true);
  });

  it('should handle Ollama service unavailable (503)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ 
        error: 'Ollama service unavailable',
        message: 'Cannot connect to Ollama. Please ensure Ollama is running.'
      }),
    });

    const { result } = renderHook(() => useOllamaModels(false));

    await act(async () => {
      await result.current.fetchModels();
    });

    expect(result.current.models).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toContain('Cannot connect to Ollama');
    expect(result.current.isAvailable).toBe(false);
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useOllamaModels(false));

    await act(async () => {
      await result.current.fetchModels();
    });

    expect(result.current.models).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.isAvailable).toBe(false);
  });

  it('should cache models and avoid repeated fetches', async () => {
    const mockModels = [
      { name: 'gemma3:4b', size: 4000000000, modified: '2024-01-01', digest: 'abc123' },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, models: mockModels }),
    });

    const { result } = renderHook(() => useOllamaModels(false));

    // First fetch
    await act(async () => {
      await result.current.fetchModels();
    });
    expect(result.current.models).toEqual(mockModels);

    // Clear mock call count
    mockFetch.mockClear();

    // Second fetch should use cache
    await act(async () => {
      await result.current.fetchModels();
    });

    // Fetch should not be called again due to caching
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  it('should clear cache when clearCache is called', async () => {
    const mockModels = [
      { name: 'gemma3:4b', size: 4000000000, modified: '2024-01-01', digest: 'abc123' },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, models: mockModels }),
    });

    const { result } = renderHook(() => useOllamaModels(false));

    // First fetch
    await act(async () => {
      await result.current.fetchModels();
    });
    expect(result.current.models).toEqual(mockModels);

    // Clear cache
    act(() => {
      result.current.clearCache();
    });

    // Second fetch should call API again
    await act(async () => {
      await result.current.fetchModels();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should auto-fetch on mount when autoFetch is true', async () => {
    const mockModels = [
      { name: 'gemma3:4b', size: 4000000000, modified: '2024-01-01', digest: 'abc123' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, models: mockModels }),
    });

    const { result } = renderHook(() => useOllamaModels(true));

    await waitFor(() => expect(result.current.models).toEqual(mockModels), { timeout: 3000 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should not auto-fetch on mount when autoFetch is false', () => {
    renderHook(() => useOllamaModels(false));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle invalid response format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false }), // Missing models array
    });

    const { result } = renderHook(() => useOllamaModels(false));

    await act(async () => {
      await result.current.fetchModels();
    });

    expect(result.current.error).toContain('Invalid response format');
    expect(result.current.isAvailable).toBe(false);
  });
});
