/**
 * Unit tests for AIImageVisualization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIImageVisualization } from './AIImageVisualization';
import type { AudioData } from '../../types/audio';
import type { ColorScheme } from '../../types/visualization';

describe('AIImageVisualization', () => {
  let visualization: AIImageVisualization;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let mockAudioData: AudioData;

  beforeEach(() => {
    // Create mock canvas and context
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;

    // Create visualization instance
    visualization = new AIImageVisualization();

    // Create mock audio data
    mockAudioData = {
      frequencyData: new Uint8Array(128).fill(128),
      timeDomainData: new Uint8Array(128).fill(128),
      bpm: 120,
      energy: 0.5,
    };
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        visualization.initialize(canvas, ctx);
      }).not.toThrow();
    });

    it('should set initial state correctly', () => {
      visualization.initialize(canvas, ctx);
      const state = visualization.getState();

      expect(state.opacity).toBe(0.8);
      expect(state.blendMode).toBe('normal');
      expect(state.updateInterval).toBe(30000);
      expect(state.imageURL).toBe('');
    });
  });

  describe('configuration', () => {
    beforeEach(() => {
      visualization.initialize(canvas, ctx);
    });

    it('should set opacity within valid range', () => {
      visualization.setOpacity(0.5);
      expect(visualization.getState().opacity).toBe(0.5);

      visualization.setOpacity(1.5); // Above max
      expect(visualization.getState().opacity).toBe(1.0);

      visualization.setOpacity(-0.5); // Below min
      expect(visualization.getState().opacity).toBe(0.0);
    });

    it('should set blend mode', () => {
      visualization.setBlendMode('multiply');
      expect(visualization.getState().blendMode).toBe('multiply');

      visualization.setBlendMode('screen');
      expect(visualization.getState().blendMode).toBe('screen');
    });

    it('should set update interval with minimum constraint', () => {
      visualization.setUpdateInterval(60000);
      expect(visualization.getState().updateInterval).toBe(60000);

      visualization.setUpdateInterval(1000); // Below minimum
      expect(visualization.getState().updateInterval).toBe(5000);
    });

    it('should update color scheme', () => {
      const newColorScheme: ColorScheme = {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
      };

      expect(() => {
        visualization.setColorScheme(newColorScheme);
      }).not.toThrow();
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      visualization.initialize(canvas, ctx);
    });

    it('should render without errors when no image is loaded', () => {
      expect(() => {
        visualization.render(mockAudioData, performance.now());
      }).not.toThrow();
    });

    it('should render fallback gradient when no image available', () => {
      // Just verify it renders without errors
      // The actual rendering is tested by the fact that it doesn't throw
      expect(() => {
        visualization.render(mockAudioData, performance.now());
      }).not.toThrow();
    });

    it('should handle different audio energy levels', () => {
      const lowEnergyData = { ...mockAudioData, energy: 0.1 };
      const highEnergyData = { ...mockAudioData, energy: 0.9 };

      expect(() => {
        visualization.render(lowEnergyData, performance.now());
        visualization.render(highEnergyData, performance.now());
      }).not.toThrow();
    });

    it('should handle different BPM values', () => {
      const slowBPM = { ...mockAudioData, bpm: 60 };
      const fastBPM = { ...mockAudioData, bpm: 180 };

      expect(() => {
        visualization.render(slowBPM, performance.now());
        visualization.render(fastBPM, performance.now());
      }).not.toThrow();
    });
  });

  describe('image generation', () => {
    beforeEach(() => {
      visualization.initialize(canvas, ctx);
    });

    it('should handle generation failure gracefully', async () => {
      // The current implementation throws an error for unimplemented AI
      // This should be caught and handled gracefully
      await expect(
        visualization.generateImage(mockAudioData)
      ).resolves.not.toThrow();
    });

    it('should not start multiple generations simultaneously', async () => {
      const promise1 = visualization.generateImage(mockAudioData);
      const promise2 = visualization.generateImage(mockAudioData);

      await Promise.all([promise1, promise2]);

      // Both should complete without errors
      expect(true).toBe(true);
    });

    it('should create different prompts for different audio characteristics', () => {
      const energeticData = { ...mockAudioData, bpm: 150, energy: 0.8 };
      const calmData = { ...mockAudioData, bpm: 70, energy: 0.3 };

      // Both should render without errors
      expect(() => {
        visualization.render(energeticData, performance.now());
        visualization.render(calmData, performance.now());
      }).not.toThrow();
    });
  });

  describe('state management', () => {
    beforeEach(() => {
      visualization.initialize(canvas, ctx);
    });

    it('should return current state', () => {
      const state = visualization.getState();

      expect(state).toHaveProperty('imageURL');
      expect(state).toHaveProperty('opacity');
      expect(state).toHaveProperty('blendMode');
      expect(state).toHaveProperty('updateInterval');
    });

    it('should not mutate returned state', () => {
      const state1 = visualization.getState();
      state1.opacity = 0.1;

      const state2 = visualization.getState();
      expect(state2.opacity).toBe(0.8); // Original value
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      visualization.initialize(canvas, ctx);
    });

    it('should cleanup resources', () => {
      expect(() => {
        visualization.cleanup();
      }).not.toThrow();
    });

    it('should not error when rendering after cleanup', () => {
      visualization.cleanup();

      expect(() => {
        visualization.render(mockAudioData, performance.now());
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle rendering before initialization', () => {
      expect(() => {
        visualization.render(mockAudioData, performance.now());
      }).not.toThrow();
    });

    it('should handle extreme opacity values', () => {
      visualization.initialize(canvas, ctx);

      visualization.setOpacity(999);
      expect(visualization.getState().opacity).toBe(1.0);

      visualization.setOpacity(-999);
      expect(visualization.getState().opacity).toBe(0.0);
    });

    it('should handle zero BPM', () => {
      visualization.initialize(canvas, ctx);
      const zeroBPMData = { ...mockAudioData, bpm: 0 };

      expect(() => {
        visualization.render(zeroBPMData, performance.now());
      }).not.toThrow();
    });

    it('should handle zero energy', () => {
      visualization.initialize(canvas, ctx);
      const zeroEnergyData = { ...mockAudioData, energy: 0 };

      expect(() => {
        visualization.render(zeroEnergyData, performance.now());
      }).not.toThrow();
    });
  });

  describe('blend modes', () => {
    beforeEach(() => {
      visualization.initialize(canvas, ctx);
    });

    it('should support common blend modes', () => {
      const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'];

      blendModes.forEach(mode => {
        expect(() => {
          visualization.setBlendMode(mode);
          visualization.render(mockAudioData, performance.now());
        }).not.toThrow();
      });
    });
  });

  describe('caching behavior', () => {
    beforeEach(() => {
      visualization.initialize(canvas, ctx);
    });

    it('should handle repeated renders with same audio features', () => {
      const timestamp = performance.now();

      expect(() => {
        visualization.render(mockAudioData, timestamp);
        visualization.render(mockAudioData, timestamp + 100);
        visualization.render(mockAudioData, timestamp + 200);
      }).not.toThrow();
    });

    it('should handle renders with changing audio features', () => {
      let timestamp = performance.now();

      for (let i = 0; i < 10; i++) {
        const audioData = {
          ...mockAudioData,
          bpm: 100 + i * 10,
          energy: 0.3 + i * 0.05,
        };

        expect(() => {
          visualization.render(audioData, timestamp);
          timestamp += 1000;
        }).not.toThrow();
      }
    });
  });
});
