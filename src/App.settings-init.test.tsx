import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettingsStore } from './stores/settingsStore';

/**
 * Test for Task 14: Initialize settings on app load
 * Requirements: 8.2, 8.4
 * 
 * This test verifies that:
 * 1. Settings are loaded from storage on app mount
 * 2. Corrupted settings are handled gracefully by falling back to defaults
 */
describe('Settings Initialization on App Load', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should load settings from storage on mount', async () => {
    // Arrange: Store some settings in localStorage
    const testSettings = {
      version: '1.0',
      persona: 'nietzsche',
      language: 'en',
      provider: 'openai',
      ollamaModel: 'gemma3:4b',
      openaiApiKey: null
    };
    localStorage.setItem('music-poetry-canvas-settings', JSON.stringify(testSettings));

    // Act: Initialize the store
    const { result } = renderHook(() => useSettingsStore());
    await result.current.loadSettings();

    // Assert: Settings should be loaded
    expect(result.current.settings.persona).toBe('nietzsche');
    expect(result.current.settings.language).toBe('en');
    expect(result.current.settings.provider).toBe('openai');
  });

  it('should handle corrupted settings gracefully by using defaults', async () => {
    // Arrange: Store corrupted JSON in localStorage
    localStorage.setItem('music-poetry-canvas-settings', 'invalid-json{');

    // Act: Initialize the store
    const { result } = renderHook(() => useSettingsStore());
    await result.current.loadSettings();

    // Assert: Should fall back to default settings
    expect(result.current.settings.persona).toBe('hamlet');
    expect(result.current.settings.language).toBe('ko');
    expect(result.current.settings.provider).toBe('ollama');
    expect(result.current.settings.ollamaModel).toBe('gemma3:4b');
  });

  it('should use default settings when no stored settings exist', async () => {
    // Arrange: No settings in localStorage (already cleared in beforeEach)

    // Act: Initialize the store
    const { result } = renderHook(() => useSettingsStore());
    await result.current.loadSettings();

    // Assert: Should use default settings
    expect(result.current.settings.persona).toBe('hamlet');
    expect(result.current.settings.language).toBe('ko');
    expect(result.current.settings.provider).toBe('ollama');
    expect(result.current.settings.ollamaModel).toBe('gemma3:4b');
    expect(result.current.settings.openaiApiKey).toBeNull();
  });

  it('should handle version mismatch by using defaults', async () => {
    // Arrange: Store settings with wrong version
    const testSettings = {
      version: '0.5', // Wrong version
      persona: 'kafka',
      language: 'de',
      provider: 'ollama',
      ollamaModel: 'mistral',
      openaiApiKey: null
    };
    localStorage.setItem('music-poetry-canvas-settings', JSON.stringify(testSettings));

    // Act: Initialize the store
    const { result } = renderHook(() => useSettingsStore());
    await result.current.loadSettings();

    // Assert: Should fall back to default settings due to version mismatch
    expect(result.current.settings.persona).toBe('hamlet');
    expect(result.current.settings.language).toBe('ko');
  });
});
