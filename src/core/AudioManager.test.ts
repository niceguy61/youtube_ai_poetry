/**
 * AudioManager Unit Tests
 * 
 * Tests for audio loading, playback controls, and event subscriptions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from './AudioManager';

// Mock AudioContext and related APIs
class MockAudioContext {
  state: 'running' | 'suspended' = 'running';
  currentTime = 0;
  destination = {};

  async resume() {
    this.state = 'running';
  }

  async close() {
    // Mock close
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    // Create a mock AudioBuffer
    // Duration = bytes / (sampleRate * channels * bytesPerSample)
    // For 16-bit audio: bytesPerSample = 2
    const duration = arrayBuffer.byteLength / (44100 * 2 * 2);
    return {
      duration,
      length: arrayBuffer.byteLength,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(0),
      copyFromChannel: () => {},
      copyToChannel: () => {}
    } as AudioBuffer;
  }

  createBufferSource(): AudioBufferSourceNode {
    return {
      buffer: null,
      onended: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    } as any;
  }
}

// Setup global mocks
global.AudioContext = MockAudioContext as any;
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
}) as any;
global.cancelAnimationFrame = vi.fn();

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    audioManager.dispose();
  });

  describe('loadFromFile', () => {
    it('should load a valid MP3 file', async () => {
      // Create a mock file with valid duration (< 300s)
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 100); // ~100 seconds
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;

      const audioSource = await audioManager.loadFromFile(mockFile);

      expect(audioSource).toBeDefined();
      expect(audioSource.duration).toBeLessThanOrEqual(300);
      expect(audioSource.metadata.sourceType).toBe('file');
      expect(audioSource.metadata.title).toBe('test');
    });

    it('should load a valid OGG file', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 100);
      const mockFile = {
        name: 'test.ogg',
        type: 'audio/ogg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;

      const audioSource = await audioManager.loadFromFile(mockFile);

      expect(audioSource).toBeDefined();
      expect(audioSource.metadata.sourceType).toBe('file');
    });

    it('should reject invalid file format', async () => {
      const mockArrayBuffer = new ArrayBuffer(1000);
      const mockFile = {
        name: 'test.wav',
        type: 'audio/wav',
        arrayBuffer: async () => mockArrayBuffer
      } as File;

      await expect(audioManager.loadFromFile(mockFile)).rejects.toThrow('Invalid file format');
    });

    it('should reject audio longer than 5 minutes', async () => {
      // Create a mock file with duration > 300s
      // Duration = bytes / (sampleRate * channels * bytesPerSample)
      // For 350 seconds: 350 * 44100 * 2 * 2 = 61,740,000 bytes
      const mockArrayBuffer = new ArrayBuffer(61740000); // ~350 seconds
      const mockFile = {
        name: 'long.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;

      await expect(audioManager.loadFromFile(mockFile)).rejects.toThrow('exceeds the maximum limit');
    });

    it('should accept audio exactly at 5 minutes', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 300); // Exactly 300 seconds
      const mockFile = {
        name: 'exact.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;

      const audioSource = await audioManager.loadFromFile(mockFile);

      expect(audioSource).toBeDefined();
      expect(audioSource.duration).toBeLessThanOrEqual(300);
    });
  });

  describe('loadFromURL', () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = vi.fn();
    });

    it('should load audio from a valid URL', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 100);
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockArrayBuffer
      });

      const audioSource = await audioManager.loadFromURL('https://example.com/audio.mp3');

      expect(audioSource).toBeDefined();
      expect(audioSource.metadata.sourceType).toBe('url');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/audio.mp3',
        expect.objectContaining({ mode: 'cors' })
      );
    });

    it('should reject invalid URL format', async () => {
      await expect(audioManager.loadFromURL('not-a-url')).rejects.toThrow('Invalid URL format');
    });

    it('should handle fetch failures', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(audioManager.loadFromURL('https://example.com/missing.mp3')).rejects.toThrow('Failed to fetch audio');
    });

    it('should validate duration from URL audio', async () => {
      // For 350 seconds: 350 * 44100 * 2 * 2 = 61,740,000 bytes
      const mockArrayBuffer = new ArrayBuffer(61740000); // > 300s
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockArrayBuffer
      });

      await expect(audioManager.loadFromURL('https://example.com/long.mp3')).rejects.toThrow('exceeds the maximum limit');
    });
  });

  describe('loadFromYouTube', () => {
    it('should throw not implemented error', async () => {
      await expect(audioManager.loadFromYouTube('https://youtube.com/watch?v=test')).rejects.toThrow('not yet implemented');
    });
  });

  describe('playback controls', () => {
    beforeEach(async () => {
      // Load a mock audio file
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10); // 10 seconds
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);
    });

    it('should start playback', () => {
      audioManager.play();
      expect(audioManager.isPlaying()).toBe(true);
      expect(audioManager.getPlaybackState()).toBe('playing');
    });

    it('should pause playback', () => {
      audioManager.play();
      audioManager.pause();
      expect(audioManager.isPlaying()).toBe(false);
      expect(audioManager.getPlaybackState()).toBe('paused');
    });

    it('should stop playback and reset time', () => {
      audioManager.play();
      audioManager.stop();
      expect(audioManager.isPlaying()).toBe(false);
      expect(audioManager.getCurrentTime()).toBe(0);
      expect(audioManager.getPlaybackState()).toBe('stopped');
    });

    it('should throw error when playing without loaded audio', () => {
      const emptyManager = new AudioManager();
      expect(() => emptyManager.play()).toThrow('No audio loaded');
      emptyManager.dispose();
    });

    it('should not start playback if already playing', () => {
      audioManager.play();
      const firstState = audioManager.getPlaybackState();
      audioManager.play(); // Try to play again
      expect(audioManager.getPlaybackState()).toBe(firstState);
    });
  });

  describe('seek', () => {
    beforeEach(async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10); // 10 seconds
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);
    });

    it('should seek to a valid time', () => {
      audioManager.seek(5);
      expect(audioManager.getCurrentTime()).toBe(5);
    });

    it('should throw error for negative time', () => {
      expect(() => audioManager.seek(-1)).toThrow('out of bounds');
    });

    it('should throw error for time beyond duration', () => {
      const duration = audioManager.getDuration();
      expect(() => audioManager.seek(duration + 1)).toThrow('out of bounds');
    });

    it('should resume playback after seek if was playing', () => {
      audioManager.play();
      audioManager.seek(3);
      expect(audioManager.isPlaying()).toBe(true);
    });

    it('should remain paused after seek if was paused', () => {
      audioManager.pause();
      audioManager.seek(3);
      expect(audioManager.isPlaying()).toBe(false);
    });
  });

  describe('state queries', () => {
    it('should return 0 duration when no audio loaded', () => {
      expect(audioManager.getDuration()).toBe(0);
    });

    it('should return correct duration after loading', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      expect(audioManager.getDuration()).toBeGreaterThan(0);
    });

    it('should return current time', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      expect(audioManager.getCurrentTime()).toBe(0);
    });

    it('should return null source when none loaded', () => {
      expect(audioManager.getCurrentSource()).toBeNull();
    });

    it('should return current source after loading', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      const source = audioManager.getCurrentSource();
      expect(source).not.toBeNull();
      expect(source?.metadata.sourceType).toBe('file');
    });
  });

  describe('event subscriptions', () => {
    it('should notify subscribers of playback state changes', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      const stateChanges: string[] = [];
      audioManager.onPlaybackStateChange((state) => {
        stateChanges.push(state);
      });

      audioManager.play();
      audioManager.pause();

      expect(stateChanges).toContain('playing');
      expect(stateChanges).toContain('paused');
    });

    it('should allow unsubscribing from state changes', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      const callback = vi.fn();
      const unsubscribe = audioManager.onPlaybackStateChange(callback);

      audioManager.play();
      expect(callback).toHaveBeenCalled();

      callback.mockClear();
      unsubscribe();

      audioManager.pause();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should notify subscribers of time updates', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      const timeUpdates: number[] = [];
      audioManager.onTimeUpdate((time) => {
        timeUpdates.push(time);
      });

      audioManager.play();
      
      // Wait for at least one time update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      audioManager.stop();

      expect(timeUpdates.length).toBeGreaterThan(0);
    });

    it('should allow unsubscribing from time updates', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      const callback = vi.fn();
      const unsubscribe = audioManager.onTimeUpdate(callback);

      unsubscribe();

      audioManager.play();
      await new Promise(resolve => setTimeout(resolve, 50));
      audioManager.stop();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should cleanup all resources', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      audioManager.play();
      audioManager.dispose();

      expect(audioManager.isPlaying()).toBe(false);
      expect(audioManager.getCurrentSource()).toBeNull();
    });

    it('should clear all event subscribers', async () => {
      const mockArrayBuffer = new ArrayBuffer(44100 * 2 * 10);
      const mockFile = {
        name: 'test.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await audioManager.loadFromFile(mockFile);

      const callback = vi.fn();
      audioManager.onPlaybackStateChange(callback);

      audioManager.dispose();

      // Create new manager and try to trigger events
      const newManager = new AudioManager();
      const newMockFile = {
        name: 'test2.mp3',
        type: 'audio/mpeg',
        arrayBuffer: async () => mockArrayBuffer
      } as File;
      await newManager.loadFromFile(newMockFile);
      newManager.play();

      // Original callback should not be called
      expect(callback).not.toHaveBeenCalled();
      
      newManager.dispose();
    });
  });
});
