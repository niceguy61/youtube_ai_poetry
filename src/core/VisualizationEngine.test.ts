/**
 * Tests for VisualizationEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisualizationEngine } from './VisualizationEngine';
import type { AudioData } from '../types/audio';
import type { VisualizationMode, VisualizationLayer } from '../types/visualization';

describe('VisualizationEngine', () => {
  let engine: VisualizationEngine;
  let canvas: HTMLCanvasElement;
  let mockContext: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Create mock context with necessary methods
    mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      } as any)),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    };
    
    // Mock getContext to return our mock context
    vi.spyOn(canvas, 'getContext').mockReturnValue(mockContext as CanvasRenderingContext2D);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      toJSON: () => {},
    } as DOMRect);
    
    engine = new VisualizationEngine();
  });

  afterEach(() => {
    if (engine && engine.isInitialized()) {
      engine.cleanup();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with a canvas element', () => {
      expect(() => engine.initialize(canvas)).not.toThrow();
      expect(engine.isInitialized()).toBe(true);
    });

    it('should throw error if canvas context cannot be obtained', () => {
      const badCanvas = {} as HTMLCanvasElement;
      badCanvas.getContext = () => null;
      
      expect(() => engine.initialize(badCanvas)).toThrow('Failed to get 2D context from canvas');
    });

    it('should not reinitialize if already initialized', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      engine.initialize(canvas);
      engine.initialize(canvas);
      
      expect(consoleSpy).toHaveBeenCalledWith('[VisualizationEngine] Already initialized');
      consoleSpy.mockRestore();
    });

    it('should throw error when calling methods before initialization', () => {
      expect(() => engine.setMode('equalizer')).toThrow(
        'VisualizationEngine not initialized. Call initialize() first.'
      );
    });
  });

  describe('Mode Management', () => {
    beforeEach(() => {
      engine.initialize(canvas);
    });

    it('should set visualization mode', () => {
      engine.setMode('equalizer');
      expect(engine.getCurrentMode()).toBe('equalizer');
    });

    it('should not change mode if already set to the same mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      engine.setMode('gradient');
      consoleSpy.mockClear();
      
      engine.setMode('gradient');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should update layers when mode changes', () => {
      engine.setMode('gradient');
      expect(engine.getEnabledLayers()).toEqual(['background-gradient']);
      
      engine.setMode('equalizer');
      expect(engine.getEnabledLayers()).toContain('background-gradient');
      expect(engine.getEnabledLayers()).toContain('equalizer-bars');
    });

    it('should handle all visualization modes', () => {
      const modes: VisualizationMode[] = ['gradient', 'equalizer', 'spotlight', 'ai-image', 'combined'];
      
      modes.forEach(mode => {
        expect(() => engine.setMode(mode)).not.toThrow();
        expect(engine.getCurrentMode()).toBe(mode);
      });
    });
  });

  describe('Layer Management', () => {
    beforeEach(() => {
      engine.initialize(canvas);
    });

    it('should enable a layer', () => {
      engine.enableLayer('equalizer-bars');
      expect(engine.getEnabledLayers()).toContain('equalizer-bars');
    });

    it('should disable a layer', () => {
      engine.enableLayer('equalizer-bars');
      engine.disableLayer('equalizer-bars');
      expect(engine.getEnabledLayers()).not.toContain('equalizer-bars');
    });

    it('should not add duplicate layers', () => {
      engine.enableLayer('equalizer-bars');
      engine.enableLayer('equalizer-bars');
      
      const layers = engine.getEnabledLayers();
      const count = layers.filter(l => l === 'equalizer-bars').length;
      expect(count).toBe(1);
    });

    it('should handle enabling multiple layers', () => {
      const layers: VisualizationLayer[] = ['background-gradient', 'equalizer-bars', 'spotlight-effects'];
      
      layers.forEach(layer => engine.enableLayer(layer));
      
      const enabledLayers = engine.getEnabledLayers();
      layers.forEach(layer => {
        expect(enabledLayers).toContain(layer);
      });
    });
  });

  describe('Configuration', () => {
    beforeEach(() => {
      engine.initialize(canvas);
    });

    it('should set configuration', () => {
      const config = {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF',
        },
        sensitivity: 1.5,
        smoothing: 0.9,
        layers: ['background-gradient' as VisualizationLayer],
      };
      
      engine.setConfig(config);
      
      const currentConfig = engine.getConfig();
      expect(currentConfig.colors.primary).toBe('#FF0000');
      expect(currentConfig.sensitivity).toBe(1.5);
      expect(currentConfig.smoothing).toBe(0.9);
    });

    it('should merge partial configuration', () => {
      const originalConfig = engine.getConfig();
      
      engine.setConfig({
        sensitivity: 2.0,
      });
      
      const newConfig = engine.getConfig();
      expect(newConfig.sensitivity).toBe(2.0);
      expect(newConfig.colors).toEqual(originalConfig.colors);
    });
  });

  describe('Rendering', () => {
    let audioData: AudioData;

    beforeEach(() => {
      engine.initialize(canvas);
      
      audioData = {
        frequencyData: new Uint8Array([128, 255, 64, 0]),
        timeDomainData: new Uint8Array([128, 128, 128, 128]),
        bpm: 120,
        energy: 0.75,
      };
    });

    it('should render without errors', () => {
      expect(() => engine.render(audioData, performance.now())).not.toThrow();
    });

    it('should clear canvas before rendering', () => {
      engine.render(audioData, performance.now());
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    });

    it('should render background gradient in gradient mode', () => {
      engine.setMode('gradient');
      engine.render(audioData, performance.now());
      
      expect(mockContext.createLinearGradient).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should update audio data', () => {
      expect(() => engine.updateAudioData(audioData)).not.toThrow();
    });
  });

  describe('Rendering Loop', () => {
    let audioData: AudioData;

    beforeEach(() => {
      engine.initialize(canvas);
      
      audioData = {
        frequencyData: new Uint8Array([128, 255, 64, 0]),
        timeDomainData: new Uint8Array([128, 128, 128, 128]),
        bpm: 120,
        energy: 0.75,
      };
      
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start rendering loop', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      
      engine.startRendering();
      
      expect(rafSpy).toHaveBeenCalled();
      rafSpy.mockRestore();
    });

    it('should stop rendering loop', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      
      engine.startRendering();
      engine.stopRendering();
      
      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });

    it('should not start rendering if already rendering', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      engine.startRendering();
      engine.startRendering();
      
      expect(consoleSpy).toHaveBeenCalledWith('[VisualizationEngine] Already rendering');
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      engine.initialize(canvas);
      engine.startRendering();
      
      engine.cleanup();
      
      expect(engine.isInitialized()).toBe(false);
    });

    it('should stop rendering on cleanup', () => {
      engine.initialize(canvas);
      engine.startRendering();
      
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      
      engine.cleanup();
      
      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });

  describe('Mode-specific layer configuration', () => {
    beforeEach(() => {
      engine.initialize(canvas);
    });

    it('should enable correct layers for gradient mode', () => {
      engine.setMode('gradient');
      const layers = engine.getEnabledLayers();
      
      expect(layers).toContain('background-gradient');
      expect(layers).toHaveLength(1);
    });

    it('should enable correct layers for equalizer mode', () => {
      engine.setMode('equalizer');
      const layers = engine.getEnabledLayers();
      
      expect(layers).toContain('background-gradient');
      expect(layers).toContain('equalizer-bars');
    });

    it('should enable correct layers for spotlight mode', () => {
      engine.setMode('spotlight');
      const layers = engine.getEnabledLayers();
      
      expect(layers).toContain('background-gradient');
      expect(layers).toContain('spotlight-effects');
    });

    it('should enable correct layers for ai-image mode', () => {
      engine.setMode('ai-image');
      const layers = engine.getEnabledLayers();
      
      expect(layers).toContain('ai-generated-image');
    });

    it('should enable multiple layers for combined mode', () => {
      engine.setMode('combined');
      const layers = engine.getEnabledLayers();
      
      expect(layers).toContain('background-gradient');
      expect(layers).toContain('equalizer-bars');
      expect(layers).toContain('spotlight-effects');
      expect(layers).toContain('particles');
    });
  });
});
