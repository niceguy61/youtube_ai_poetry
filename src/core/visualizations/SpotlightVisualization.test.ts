/**
 * Tests for SpotlightVisualization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpotlightVisualization } from './SpotlightVisualization';
import type { AudioData } from '../../types/audio';
import type { ColorScheme } from '../../types/visualization';

describe('SpotlightVisualization', () => {
  let visualization: SpotlightVisualization;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let mockAudioData: AudioData;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;

    // Create visualization instance
    visualization = new SpotlightVisualization();

    // Mock audio data
    mockAudioData = {
      frequencyData: new Uint8Array(128).fill(128),
      timeDomainData: new Uint8Array(128).fill(128),
      bpm: 120,
      energy: 0.5,
    };
  });

  describe('initialization', () => {
    it('should initialize with default spotlights', () => {
      visualization.initialize(canvas, ctx);
      const state = visualization.getState();
      
      expect(state.lights).toBeDefined();
      expect(state.lights.length).toBeGreaterThan(0);
      expect(state.intensity).toBe(1.0);
    });

    it('should initialize spotlights with valid positions', () => {
      visualization.initialize(canvas, ctx);
      const state = visualization.getState();
      
      state.lights.forEach((light) => {
        expect(light.position.x).toBeGreaterThanOrEqual(0);
        expect(light.position.x).toBeLessThanOrEqual(canvas.width);
        expect(light.position.y).toBeGreaterThanOrEqual(0);
        expect(light.position.y).toBeLessThanOrEqual(canvas.height);
      });
    });

    it('should initialize spotlights with valid radii', () => {
      visualization.initialize(canvas, ctx);
      const state = visualization.getState();
      
      state.lights.forEach((light) => {
        expect(light.radius).toBeGreaterThan(0);
        expect(light.radius).toBeLessThanOrEqual(100);
      });
    });

    it('should initialize spotlights with velocities', () => {
      visualization.initialize(canvas, ctx);
      const state = visualization.getState();
      
      state.lights.forEach((light) => {
        expect(light.velocity).toBeDefined();
        expect(typeof light.velocity.x).toBe('number');
        expect(typeof light.velocity.y).toBe('number');
      });
    });
  });

  describe('color scheme', () => {
    it('should apply custom color scheme', () => {
      visualization.initialize(canvas, ctx);
      
      const customColors: ColorScheme = {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
      };
      
      visualization.setColorScheme(customColors);
      const state = visualization.getState();
      
      // Check that spotlights use colors from the scheme
      const usedColors = new Set(state.lights.map(light => light.color));
      expect(usedColors.has(customColors.primary) || 
             usedColors.has(customColors.secondary) || 
             usedColors.has(customColors.accent)).toBe(true);
    });
  });

  describe('intensity control', () => {
    it('should set intensity within valid range', () => {
      visualization.initialize(canvas, ctx);
      
      visualization.setIntensity(0.7);
      expect(visualization.getState().intensity).toBe(0.7);
    });

    it('should clamp intensity to 0-1 range', () => {
      visualization.initialize(canvas, ctx);
      
      visualization.setIntensity(1.5);
      expect(visualization.getState().intensity).toBe(1.0);
      
      visualization.setIntensity(-0.5);
      expect(visualization.getState().intensity).toBe(0.0);
    });
  });

  describe('background image', () => {
    it('should handle background image loading', async () => {
      visualization.initialize(canvas, ctx);
      
      // Mock Image constructor for testing
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;
        src = '';
        
        constructor() {
          // Simulate successful load after a short delay
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      } as any;
      
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      await visualization.loadBackgroundImage(dataUrl);
      const state = visualization.getState();
      
      expect(state.backgroundImage).toBe(dataUrl);
      
      // Restore original Image
      global.Image = originalImage;
    });

    it('should clear background image', async () => {
      visualization.initialize(canvas, ctx);
      
      // Mock Image constructor
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;
        src = '';
        
        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      } as any;
      
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      await visualization.loadBackgroundImage(dataUrl);
      
      visualization.clearBackgroundImage();
      const state = visualization.getState();
      
      expect(state.backgroundImage).toBeUndefined();
      
      // Restore original Image
      global.Image = originalImage;
    });

    it('should reject invalid image URLs', async () => {
      visualization.initialize(canvas, ctx);
      
      // Mock Image constructor to simulate error
      const originalImage = global.Image;
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;
        src = '';
        
        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Failed to load'));
            }
          }, 0);
        }
      } as any;
      
      await expect(
        visualization.loadBackgroundImage('invalid-url')
      ).rejects.toThrow();
      
      // Restore original Image
      global.Image = originalImage;
    });
  });

  describe('rendering', () => {
    it('should render without errors', () => {
      visualization.initialize(canvas, ctx);
      
      expect(() => {
        visualization.render(mockAudioData, performance.now());
      }).not.toThrow();
    });

    it('should handle rendering before initialization gracefully', () => {
      expect(() => {
        visualization.render(mockAudioData, performance.now());
      }).not.toThrow();
    });

    it('should update spotlight positions over time', () => {
      visualization.initialize(canvas, ctx);
      
      // Get initial state
      const state1 = visualization.getState();
      
      // Render a frame
      const timestamp1 = 1000;
      visualization.render(mockAudioData, timestamp1);
      
      // Render another frame with time delta
      const timestamp2 = timestamp1 + 1000; // 1 second later
      visualization.render(mockAudioData, timestamp2);
      
      const state2 = visualization.getState();
      
      // Verify spotlights still exist and have valid properties
      expect(state2.lights.length).toBe(state1.lights.length);
      state2.lights.forEach((light) => {
        expect(light.position.x).toBeGreaterThanOrEqual(0);
        expect(light.position.x).toBeLessThanOrEqual(canvas.width);
        expect(light.position.y).toBeGreaterThanOrEqual(0);
        expect(light.position.y).toBeLessThanOrEqual(canvas.height);
      });
    });

    it('should keep spotlights within canvas bounds', () => {
      visualization.initialize(canvas, ctx);
      
      // Render many frames to test boundary conditions
      let timestamp = performance.now();
      for (let i = 0; i < 100; i++) {
        timestamp += 16;
        visualization.render(mockAudioData, timestamp);
      }
      
      const state = visualization.getState();
      
      state.lights.forEach((light) => {
        expect(light.position.x).toBeGreaterThanOrEqual(0);
        expect(light.position.x).toBeLessThanOrEqual(canvas.width);
        expect(light.position.y).toBeGreaterThanOrEqual(0);
        expect(light.position.y).toBeLessThanOrEqual(canvas.height);
      });
    });

    it('should respond to BPM changes', () => {
      visualization.initialize(canvas, ctx);
      
      const slowBPM = { ...mockAudioData, bpm: 60 };
      const fastBPM = { ...mockAudioData, bpm: 180 };
      
      // Render with slow BPM - should not throw
      expect(() => {
        let timestamp = 1000;
        for (let i = 0; i < 10; i++) {
          timestamp += 16;
          visualization.render(slowBPM, timestamp);
        }
      }).not.toThrow();
      
      // Render with fast BPM - should not throw
      expect(() => {
        let timestamp = 1000;
        for (let i = 0; i < 10; i++) {
          timestamp += 16;
          visualization.render(fastBPM, timestamp);
        }
      }).not.toThrow();
      
      // Verify state is still valid after BPM changes
      const state = visualization.getState();
      expect(state.lights.length).toBeGreaterThan(0);
      state.lights.forEach((light) => {
        expect(light.position.x).toBeGreaterThanOrEqual(0);
        expect(light.position.x).toBeLessThanOrEqual(canvas.width);
        expect(light.position.y).toBeGreaterThanOrEqual(0);
        expect(light.position.y).toBeLessThanOrEqual(canvas.height);
      });
    });

    it('should respond to energy changes', () => {
      visualization.initialize(canvas, ctx);
      
      const lowEnergy = { ...mockAudioData, energy: 0.1 };
      const highEnergy = { ...mockAudioData, energy: 0.9 };
      
      // Both should render without errors
      expect(() => {
        visualization.render(lowEnergy, performance.now());
      }).not.toThrow();
      
      expect(() => {
        visualization.render(highEnergy, performance.now());
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      visualization.initialize(canvas, ctx);
      visualization.cleanup();
      
      const state = visualization.getState();
      expect(state.lights).toHaveLength(0);
    });

    it('should handle rendering after cleanup gracefully', () => {
      visualization.initialize(canvas, ctx);
      visualization.cleanup();
      
      expect(() => {
        visualization.render(mockAudioData, performance.now());
      }).not.toThrow();
    });
  });

  describe('state management', () => {
    it('should return a copy of state', () => {
      visualization.initialize(canvas, ctx);
      
      const state1 = visualization.getState();
      const state2 = visualization.getState();
      
      // Should be equal but not the same reference
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.lights).not.toBe(state2.lights);
    });

    it('should not allow external modification of state', () => {
      visualization.initialize(canvas, ctx);
      
      const state = visualization.getState();
      const originalLightCount = state.lights.length;
      
      // Try to modify the returned state
      state.lights = [];
      state.intensity = 0;
      
      // Internal state should be unchanged
      const newState = visualization.getState();
      expect(newState.lights.length).toBe(originalLightCount);
      expect(newState.intensity).toBe(1.0);
    });
  });
});
