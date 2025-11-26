/**
 * Tests for GradientVisualization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GradientVisualization } from './GradientVisualization';
import type { AudioData } from '../../types/audio';
import type { ColorScheme } from '../../types/visualization';

describe('GradientVisualization', () => {
  let visualization: GradientVisualization;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Create mock context with necessary methods
    const mockGradient = {
      addColorStop: vi.fn(),
    };

    ctx = {
      createLinearGradient: vi.fn(() => mockGradient),
      fillRect: vi.fn(),
      fillStyle: '',
    } as any;

    visualization = new GradientVisualization();
  });

  describe('initialization', () => {
    it('should initialize with canvas and context', () => {
      visualization.initialize(canvas, ctx);
      
      const state = visualization.getState();
      expect(state.colors).toHaveLength(2);
      expect(state.bpmSync).toBe(true);
    });

    it('should set initial colors from default color scheme', () => {
      visualization.initialize(canvas, ctx);
      
      const state = visualization.getState();
      expect(state.colors[0]).toBe('#FF6B6B');
      expect(state.colors[1]).toBe('#4ECDC4');
    });
  });

  describe('color scheme', () => {
    it('should update colors when color scheme is set', () => {
      visualization.initialize(canvas, ctx);
      
      const newColorScheme: ColorScheme = {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
      };
      
      visualization.setColorScheme(newColorScheme);
      
      const state = visualization.getState();
      expect(state.colors[0]).toBe('#FF0000');
      expect(state.colors[1]).toBe('#00FF00');
    });
  });

  describe('BPM synchronization', () => {
    it('should enable BPM sync by default', () => {
      visualization.initialize(canvas, ctx);
      
      const state = visualization.getState();
      expect(state.bpmSync).toBe(true);
    });

    it('should allow disabling BPM sync', () => {
      visualization.initialize(canvas, ctx);
      
      visualization.setBPMSync(false);
      
      const state = visualization.getState();
      expect(state.bpmSync).toBe(false);
    });

    it('should update animation phase based on BPM', () => {
      const startTime = performance.now();
      visualization.initialize(canvas, ctx);
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(128),
        timeDomainData: new Uint8Array(128),
        bpm: 120,
        energy: 0.5,
      };
      
      // Use timestamps with a clear gap
      const timestamp1 = startTime + 100; // 100ms after init
      visualization.render(audioData, timestamp1);
      const state1 = visualization.getState();
      
      // Render again after 500ms more (should be 1 beat at 120 BPM)
      const timestamp2 = startTime + 600;
      visualization.render(audioData, timestamp2);
      const state2 = visualization.getState();
      
      // Animation phase should have progressed
      expect(state2.animationPhase).not.toBe(state1.animationPhase);
    });
  });

  describe('rendering', () => {
    it('should render gradient to canvas', () => {
      visualization.initialize(canvas, ctx);
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(128),
        timeDomainData: new Uint8Array(128),
        bpm: 120,
        energy: 0.5,
      };
      
      visualization.render(audioData, 0);
      
      // Verify gradient was created and canvas was filled
      expect(ctx.createLinearGradient).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should handle rendering without initialization gracefully', () => {
      const audioData: AudioData = {
        frequencyData: new Uint8Array(128),
        timeDomainData: new Uint8Array(128),
        bpm: 120,
        energy: 0.5,
      };
      
      // Should not throw
      expect(() => visualization.render(audioData, 0)).not.toThrow();
    });

    it('should use fallback BPM when BPM is 0', () => {
      visualization.initialize(canvas, ctx);
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(128),
        timeDomainData: new Uint8Array(128),
        bpm: 0,
        energy: 0.5,
      };
      
      // Should not throw and should render
      expect(() => visualization.render(audioData, 0)).not.toThrow();
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      visualization.initialize(canvas, ctx);
      visualization.cleanup();
      
      // After cleanup, rendering should not throw but also not render
      const audioData: AudioData = {
        frequencyData: new Uint8Array(128),
        timeDomainData: new Uint8Array(128),
        bpm: 120,
        energy: 0.5,
      };
      
      const fillRectCalls = (ctx.fillRect as any).mock.calls.length;
      visualization.render(audioData, 0);
      
      // fillRect should not be called after cleanup
      expect((ctx.fillRect as any).mock.calls.length).toBe(fillRectCalls);
    });
  });

  describe('animation phase calculation', () => {
    it('should cycle animation phase between 0 and 1', () => {
      visualization.initialize(canvas, ctx);
      
      const audioData: AudioData = {
        frequencyData: new Uint8Array(128),
        timeDomainData: new Uint8Array(128),
        bpm: 120, // 2 beats per second
        energy: 0.5,
      };
      
      // Render at different timestamps
      visualization.render(audioData, 0);
      const state1 = visualization.getState();
      
      visualization.render(audioData, 250); // 0.25 seconds = 0.5 beats
      const state2 = visualization.getState();
      
      visualization.render(audioData, 500); // 0.5 seconds = 1 beat (should wrap)
      const state3 = visualization.getState();
      
      // Phase should be between 0 and 1
      expect(state1.animationPhase).toBeGreaterThanOrEqual(0);
      expect(state1.animationPhase).toBeLessThan(1);
      expect(state2.animationPhase).toBeGreaterThanOrEqual(0);
      expect(state2.animationPhase).toBeLessThan(1);
      expect(state3.animationPhase).toBeGreaterThanOrEqual(0);
      expect(state3.animationPhase).toBeLessThan(1);
    });
  });
});
