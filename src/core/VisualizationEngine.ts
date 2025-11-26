/**
 * VisualizationEngine - Core visualization rendering system
 * 
 * Manages real-time audio visualization with multiple rendering modes and layers.
 * Provides a flexible pipeline for compositing different visualization effects.
 * 
 * Requirements: 2.1, 2.3, 12.6
 */

import type {
  VisualizationMode,
  VisualizationLayer,
  VisualizationConfig,
  ColorScheme,
} from '../types/visualization';
import type { AudioData } from '../types/audio';
import { CONFIG } from '../config/config';
import { GradientVisualization } from './visualizations/GradientVisualization';
import { EqualizerVisualization } from './visualizations/EqualizerVisualization';
import { SpotlightVisualization } from './visualizations/SpotlightVisualization';
import { AIImageVisualization } from './visualizations/AIImageVisualization';

export class VisualizationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private initialized = false;
  
  private currentMode: VisualizationMode = CONFIG.visualization.DEFAULT_MODE;
  private enabledLayers: Set<VisualizationLayer> = new Set();
  private config: VisualizationConfig = {
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFD93D',
    },
    sensitivity: 1.0,
    smoothing: CONFIG.visualization.SMOOTHING,
    layers: [],
  };
  
  private lastRenderTime = 0;
  private targetFrameTime = 1000 / CONFIG.visualization.TARGET_FPS;
  
  // Rendering state
  private isRendering = false;
  private currentAudioData: AudioData | null = null;
  
  // Visualization mode instances
  private gradientVisualization: GradientVisualization | null = null;
  private equalizerVisualization: EqualizerVisualization | null = null;
  private spotlightVisualization: SpotlightVisualization | null = null;
  private aiImageVisualization: AIImageVisualization | null = null;
  
  // Background image
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundImageLoaded = false;

  /**
   * Initialize the visualization engine with a canvas element
   * @param canvas - The HTML canvas element to render to
   */
  public initialize(canvas: HTMLCanvasElement): void {
    if (this.initialized) {
      console.warn('[VisualizationEngine] Already initialized');
      return;
    }

    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    
    this.ctx = context;
    
    // Set canvas size
    this.resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize);
    
    // Initialize layers for default mode
    this.updateLayersForMode(this.currentMode);
    
    // Initialize visualization mode instances
    this.gradientVisualization = new GradientVisualization();
    this.gradientVisualization.initialize(canvas, context);
    this.gradientVisualization.setColorScheme(this.config.colors);
    
    this.equalizerVisualization = new EqualizerVisualization();
    this.equalizerVisualization.initialize(canvas, context);
    this.equalizerVisualization.setColorScheme(this.config.colors);
    
    this.spotlightVisualization = new SpotlightVisualization();
    this.spotlightVisualization.initialize(canvas, context);
    this.spotlightVisualization.setColorScheme(this.config.colors);
    
    this.aiImageVisualization = new AIImageVisualization();
    this.aiImageVisualization.initialize(canvas, context);
    this.aiImageVisualization.setColorScheme(this.config.colors);
    
    this.initialized = true;
  }

  /**
   * Set the visualization mode
   * @param mode - The visualization mode to switch to
   */
  public setMode(mode: VisualizationMode): void {
    this.ensureInitialized();
    
    if (this.currentMode === mode) {
      return;
    }
    
    this.currentMode = mode;
    
    // Update enabled layers based on mode
    this.updateLayersForMode(mode);
  }

  /**
   * Enable a specific visualization layer
   * @param layer - The layer to enable
   */
  public enableLayer(layer: VisualizationLayer): void {
    this.ensureInitialized();
    
    if (!this.enabledLayers.has(layer)) {
      this.enabledLayers.add(layer);
    }
  }

  /**
   * Disable a specific visualization layer
   * @param layer - The layer to disable
   */
  public disableLayer(layer: VisualizationLayer): void {
    this.ensureInitialized();
    
    if (this.enabledLayers.has(layer)) {
      this.enabledLayers.delete(layer);
    }
  }

  /**
   * Get currently enabled layers
   */
  public getEnabledLayers(): VisualizationLayer[] {
    return Array.from(this.enabledLayers);
  }

  /**
   * Get current visualization mode
   */
  public getCurrentMode(): VisualizationMode {
    return this.currentMode;
  }

  /**
   * Set visualization configuration
   * @param config - Partial configuration to update
   */
  public setConfig(config: Partial<VisualizationConfig>): void {
    this.ensureInitialized();
    
    this.config = {
      ...this.config,
      ...config,
    };
    
    // Update color scheme in visualizations if colors changed
    if (config.colors) {
      if (this.gradientVisualization) {
        this.gradientVisualization.setColorScheme(config.colors);
      }
      if (this.equalizerVisualization) {
        this.equalizerVisualization.setColorScheme(config.colors);
      }
      if (this.spotlightVisualization) {
        this.spotlightVisualization.setColorScheme(config.colors);
      }
      if (this.aiImageVisualization) {
        this.aiImageVisualization.setColorScheme(config.colors);
      }
    }
    
  }

  /**
   * Apply AI-generated visualization configuration
   * @param aiConfig - Configuration from VisualizationConfigGenerator
   */
  public applyAIConfig(aiConfig: any): void {
    this.ensureInitialized();
    
    // Apply gradient config
    if (aiConfig.gradient && this.gradientVisualization) {
      const [color1, color2] = aiConfig.gradient.colors;
      this.gradientVisualization.setColorScheme({
        primary: color1,
        secondary: color2,
        accent: color2,
      });
      // Store speed for gradient (will be used in render)
      (this.gradientVisualization as any).speedMultiplier = aiConfig.gradient.speed;
    }
    
    // Apply equalizer config
    if (aiConfig.equalizer && this.equalizerVisualization) {
      this.equalizerVisualization.setBarCount(aiConfig.equalizer.barCount);
      this.equalizerVisualization.setSmoothing(aiConfig.equalizer.smoothing);
      this.equalizerVisualization.setColorScheme({
        primary: aiConfig.equalizer.colors[0],
        secondary: aiConfig.equalizer.colors[1],
        accent: aiConfig.equalizer.colors[2] || aiConfig.equalizer.colors[1],
      });
    }
    
    // Apply spotlight config
    if (aiConfig.spotlight && this.spotlightVisualization) {
      this.spotlightVisualization.setColorScheme({
        primary: aiConfig.spotlight.colors[0],
        secondary: aiConfig.spotlight.colors[1],
        accent: aiConfig.spotlight.colors[2] || aiConfig.spotlight.colors[1],
      });
      // Store spotlight-specific config
      (this.spotlightVisualization as any).aiConfig = {
        count: aiConfig.spotlight.count,
        speed: aiConfig.spotlight.speed,
        radius: aiConfig.spotlight.radius,
      };
      // Reinitialize spotlights with new config
      (this.spotlightVisualization as any).initializeSpotlights?.();
    }
    
  }

  /**
   * Get current configuration
   */
  public getConfig(): VisualizationConfig {
    return { ...this.config };
  }

  /**
   * Set background image for visualizations
   * @param imageUrl - URL of the background image
   */
  public async setBackgroundImage(imageUrl: string | undefined): Promise<void> {
    this.ensureInitialized();
    
    if (!imageUrl) {
      // Clear background image
      this.backgroundImage = null;
      this.backgroundImageLoaded = false;
      return;
    }
    
    // Load background image
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.backgroundImage = img;
        this.backgroundImageLoaded = true;
        resolve();
      };
      
      img.onerror = (error) => {
        console.error('[VisualizationEngine] Failed to load background image from URL:', imageUrl);
        console.error('[VisualizationEngine] Error details:', error);
        this.backgroundImageLoaded = false;
        reject(new Error(`Failed to load background image from: ${imageUrl}`));
      };
      
      img.crossOrigin = 'anonymous'; // Handle CORS
      img.src = imageUrl;
    });
  }

  /**
   * Start the rendering loop
   */
  public startRendering(): void {
    this.ensureInitialized();
    
    if (this.isRendering) {
      console.warn('[VisualizationEngine] Already rendering');
      return;
    }
    
    this.isRendering = true;
    this.lastRenderTime = performance.now();
    this.renderLoop();
  }

  /**
   * Stop the rendering loop
   */
  public stopRendering(): void {
    if (!this.isRendering) {
      return;
    }
    
    this.isRendering = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main render method - renders visualization based on audio data
   * @param audioData - Current audio analysis data
   * @param timestamp - Current timestamp in milliseconds
   */
  public render(audioData: AudioData, timestamp: number): void {
    this.ensureInitialized();
    
    if (!this.ctx || !this.canvas) {
      return;
    }
    
    // Store current audio data for the render loop
    this.currentAudioData = audioData;
    
    // Clear canvas
    this.clearCanvas();
    
    // Render enabled layers in order
    this.renderLayers(audioData, timestamp);
  }

  /**
   * Update audio data for continuous rendering
   * @param audioData - Current audio analysis data
   */
  public updateAudioData(audioData: AudioData): void {
    this.currentAudioData = audioData;
  }

  /**
   * Cleanup and release resources
   */
  public cleanup(): void {
    this.stopRendering();
    
    window.removeEventListener('resize', this.handleResize);
    
    // Cleanup visualization instances
    if (this.gradientVisualization) {
      this.gradientVisualization.cleanup();
      this.gradientVisualization = null;
    }
    if (this.equalizerVisualization) {
      this.equalizerVisualization.cleanup();
      this.equalizerVisualization = null;
    }
    if (this.spotlightVisualization) {
      this.spotlightVisualization.cleanup();
      this.spotlightVisualization = null;
    }
    if (this.aiImageVisualization) {
      this.aiImageVisualization.cleanup();
      this.aiImageVisualization = null;
    }
    
    this.canvas = null;
    this.ctx = null;
    this.initialized = false;
    this.currentAudioData = null;
  }

  /**
   * Check if the engine is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  // Private methods

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('VisualizationEngine not initialized. Call initialize() first.');
    }
  }

  private handleResize = (): void => {
    this.resizeCanvas();
  };

  private resizeCanvas(): void {
    if (!this.canvas) return;
    
    // Set canvas size to match display size
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;
    
    const { width, height } = this.canvas;
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Draw background image if available
    if (this.backgroundImageLoaded && this.backgroundImage) {
      this.ctx.drawImage(this.backgroundImage, 0, 0, width, height);
      
      // Add a dark overlay to make visualizations more visible
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(0, 0, width, height);
    }
  }

  private renderLoop = (): void => {
    if (!this.isRendering) {
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastRenderTime;
    
    // Frame rate limiting
    if (deltaTime >= this.targetFrameTime) {
      if (this.currentAudioData) {
        this.render(this.currentAudioData, currentTime);
      }
      
      this.lastRenderTime = currentTime - (deltaTime % this.targetFrameTime);
    }
    
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  private renderLayers(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    
    // Render layers in order based on current mode
    const layersToRender = this.getLayersForMode(this.currentMode);
    
    for (const layer of layersToRender) {
      if (this.enabledLayers.has(layer)) {
        this.renderLayer(layer, audioData, timestamp);
      }
    }
  }

  private renderLayer(
    layer: VisualizationLayer,
    audioData: AudioData,
    timestamp: number
  ): void {
    if (!this.ctx || !this.canvas) return;
    
    // Placeholder rendering for each layer type
    // Actual implementations will be added in subsequent tasks
    switch (layer) {
      case 'background-gradient':
        this.renderBackgroundGradient(audioData, timestamp);
        break;
      case 'equalizer-bars':
        this.renderEqualizerBars(audioData, timestamp);
        break;
      case 'spotlight-effects':
        this.renderSpotlightEffects(audioData, timestamp);
        break;
      case 'ai-generated-image':
        this.renderAIImage(audioData, timestamp);
        break;
      case 'particles':
        this.renderParticles(audioData, timestamp);
        break;
    }
  }

  private renderBackgroundGradient(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    
    // Use the GradientVisualization instance for BPM-synchronized rendering
    if (this.gradientVisualization) {
      this.gradientVisualization.render(audioData, timestamp);
    }
  }

  private renderEqualizerBars(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    
    // Use the EqualizerVisualization instance for frequency bar rendering
    if (this.equalizerVisualization) {
      this.equalizerVisualization.render(audioData, timestamp);
    }
  }

  private renderSpotlightEffects(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    
    // Use the SpotlightVisualization instance for spotlight rendering
    if (this.spotlightVisualization) {
      this.spotlightVisualization.render(audioData, timestamp);
    }
  }

  private renderAIImage(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    
    // Use the AIImageVisualization instance for AI-generated image rendering
    if (this.aiImageVisualization) {
      this.aiImageVisualization.render(audioData, timestamp);
    }
  }

  private renderParticles(audioData: AudioData, timestamp: number): void {
    // Placeholder for particle rendering
    // Future enhancement
  }

  private updateLayersForMode(mode: VisualizationMode): void {
    // Clear current layers
    this.enabledLayers.clear();
    
    // Enable layers based on mode
    const layers = this.getLayersForMode(mode);
    layers.forEach(layer => this.enabledLayers.add(layer));
  }

  private getLayersForMode(mode: VisualizationMode): VisualizationLayer[] {
    switch (mode) {
      case 'gradient':
        return ['background-gradient'];
      case 'equalizer':
        return ['equalizer-bars'];
      case 'spotlight':
        return ['spotlight-effects'];
      case 'ai-image':
        return ['ai-generated-image'];
      case 'combined':
        return [
          'background-gradient',
          'equalizer-bars',
          'spotlight-effects',
          'particles',
        ];
      default:
        return ['background-gradient'];
    }
  }
}
