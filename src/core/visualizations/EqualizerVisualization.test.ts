/**
 * Unit tests for EqualizerVisualization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EqualizerVisualization } from './EqualizerVisualization';
import type { AudioData } from '../../types/audio';
import type { ColorScheme } from '../../types/visualization';

describe('EqualizerVisualization', () => {
  let equalizer: EqualizerVisualization;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    equalizer = new EqualizerVisualization();
    
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Create mock context with necessary methods
    ctx = {
      fillRect: vi.fn(),
      fillStyle: '',
    } as any;
    
    // Mock console.log to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('initialize', () => {
    it('should initialize with canvas and context', () => {
      equalizer.initialize(canvas, ctx);
      
      const state = equalizer.getState();
      expect(state.barCount).toBeGreaterThan(0);
      expect(state.barWidth).toBeGreaterThan(0);
    });

    it('should calculate bar width based on canvas width', () => {
      equalizer.initialize(canvas, ctx);
      
      const state = equalizer.getState();
      const totalWidth = state.barCount * state.barWidth + (state.barCount - 1) * state.barSpacing;
      
      // Total width should not exceed canvas width
      expect(totalWidth).toBeLessThanOrEqual(canvas.width);
    });

    it('should initialize color gradient from default color scheme', () => {
      equalizer.initialize(canvas, ctx);
      
      const state = equalizer.getState();
      expect(state.colorGradient).toHaveLength(3);
      expect(state.colorGradient[0]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('setColorScheme', () => {
    it('should update color gradient when color scheme is set', () => {
      equalizer.initialize(canvas, ctx);
      
      const newColorScheme: ColorScheme = {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
      };
      
      equalizer.setColorScheme(newColorScheme);
      
      const state = equalizer.getState();
      expect(state.colorGradient).toContain('#FF0000');
      expect(state.colorGradient).toContain('#00FF00');
      expect(state.colorGradient).toContain('#0000FF');
    });
  });

  describe('setBarCount', () => {
    it('should update bar count', () => {
      equalizer.initialize(canvas, ctx);
      
      equalizer.setBarCount(32);
      
      const state = equalizer.getState();
      expect(state.barCount).toBe(32);
    });

    it('should clamp bar count to minimum of 8', () => {
      equalizer.initialize(canvas, ctx);
      
      equalizer.setBarCount(4);
      
      const state = equalizer.getState();
      expect(state.barCount).toBe(8);
    });

    it('should clamp bar count to maximum of 256', () => {
      equalizer.initialize(canvas, ctx);
      
      equalizer.setBarCount(512);
      
      const state = equalizer.getState();
      expect(state.barCount).toBe(256);
    });
  });

  describe('setSmoothing', () => {
    it('should update smoothing factor', () => {
      equalizer.initialize(canvas, ctx);
      
      equalizer.setSmoothing(0.5);
      
      const state = equalizer.getState();
      expect(state.smoothing).toBe(0.5);
    });

    it('should clamp smoothing to 0-1 range', () => {
      equalizer.initialize(canvas, ctx);
      
      equalizer.setSmoothing(-0.5);
      expect(equalizer.getState().smoothing).toBe(0);
      
      equalizer.setSmoothing(1.5);
      expect(equalizer.getState().smoothing).toBe(1);
    });
  });

  describe('render', () => {
    it('should render without errors', () => {
      equalizer.initialize(canvas, ctx);
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(1024).fill(128),
        timeDomainData: new Uint8Array(1024),
        bpm: 120,
        energy: 0.5,
      };
      
      expect(() => {
        equalizer.render(audioData, performance.now());
      }).not.toThrow();
    });

    it('should handle empty frequency data', () => {
      equalizer.initialize(canvas, ctx);
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(0),
        timeDomainData: new Uint8Array(0),
        bpm: 120,
        energy: 0.5,
      };
      
      expect(() => {
        equalizer.render(audioData, performance.now());
      }).not.toThrow();
    });

    it('should apply smoothing across multiple frames', () => {
      equalizer.initialize(canvas, ctx);
      equalizer.setSmoothing(0.8); // High smoothing
      
      // Mock fillRect to track calls
      const fillRectCalls: number[][] = [];
      ctx.fillRect = vi.fn((...args) => {
        fillRectCalls.push(args);
      });
      
      // First frame with high frequency
      const audioData1: AudioData = {
        frequencyData: new Uint8Array(1024).fill(255),
        timeDomainData: new Uint8Array(1024),
        bpm: 120,
        energy: 1.0,
      };
      
      equalizer.render(audioData1, performance.now());
      const firstFrameHeights = fillRectCalls.map(call => call[3]); // Height is 4th arg
      
      fillRectCalls.length = 0;
      
      // Second frame with low frequency
      const audioData2: AudioData = {
        frequencyData: new Uint8Array(1024).fill(0),
        timeDomainData: new Uint8Array(1024),
        bpm: 120,
        energy: 0.0,
      };
      
      equalizer.render(audioData2, performance.now());
      const secondFrameHeights = fillRectCalls.map(call => call[3]);
      
      // With high smoothing, second frame should still have significant height
      // (not drop immediately to 0)
      const avgFirstHeight = firstFrameHeights.reduce((a, b) => a + b, 0) / firstFrameHeights.length;
      const avgSecondHeight = secondFrameHeights.reduce((a, b) => a + b, 0) / secondFrameHeights.length;
      
      expect(avgSecondHeight).toBeGreaterThan(0);
      expect(avgSecondHeight).toBeLessThan(avgFirstHeight);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      equalizer.initialize(canvas, ctx);
      
      expect(() => {
        equalizer.cleanup();
      }).not.toThrow();
    });

    it('should not error when rendering after cleanup', () => {
      equalizer.initialize(canvas, ctx);
      equalizer.cleanup();
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(1024).fill(128),
        timeDomainData: new Uint8Array(1024),
        bpm: 120,
        energy: 0.5,
      };
      
      // Should not throw, just do nothing
      expect(() => {
        equalizer.render(audioData, performance.now());
      }).not.toThrow();
    });
  });

  describe('bar height calculation', () => {
    it('should calculate bar heights proportional to frequency data', () => {
      equalizer.initialize(canvas, ctx);
      
      // Mock fillRect to capture bar heights
      const barHeights: number[] = [];
      ctx.fillRect = vi.fn((x, y, width, height) => {
        barHeights.push(height);
      });
      
      // Create frequency data with increasing values
      const frequencyData = new Uint8Array(1024);
      for (let i = 0; i < frequencyData.length; i++) {
        frequencyData[i] = Math.floor((i / frequencyData.length) * 255);
      }
      
      const audioData: AudioData = {
        frequencyData,
        timeDomainData: new Uint8Array(1024),
        bpm: 120,
        energy: 0.5,
      };
      
      equalizer.render(audioData, performance.now());
      
      // Bar heights should generally increase (with some smoothing variation)
      // Check that later bars tend to be taller than earlier bars
      const firstQuarter = barHeights.slice(0, barHeights.length / 4);
      const lastQuarter = barHeights.slice(-barHeights.length / 4);
      
      const avgFirst = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
      const avgLast = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
      
      expect(avgLast).toBeGreaterThan(avgFirst);
    });
  });

  describe('color gradient', () => {
    it('should apply color gradient across bars', () => {
      equalizer.initialize(canvas, ctx);
      
      const colors: string[] = [];
      
      // Track fillStyle assignments
      Object.defineProperty(ctx, 'fillStyle', {
        set: (value: string) => {
          colors.push(value);
        },
        get: () => '#000000',
        configurable: true,
      });
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(1024).fill(128),
        timeDomainData: new Uint8Array(1024),
        bpm: 120,
        energy: 0.5,
      };
      
      equalizer.render(audioData, performance.now());
      
      // Should have set colors for each bar
      expect(colors.length).toBeGreaterThan(0);
      
      // Colors should be valid hex colors
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});
