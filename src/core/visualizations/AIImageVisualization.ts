/**
 * AIImageVisualization - AI-generated imagery as background
 * 
 * Implements AI-generated visual imagery that serves as the background
 * for the visualization. Images are generated based on audio characteristics
 * and cached for performance. Supports opacity and blend mode controls.
 * 
 * Requirements: 12.5
 */

import type { AudioData } from '../../types/audio';
import type { ColorScheme, AIImageState } from '../../types/visualization';
import { CONFIG } from '../../config/config';

export interface VisualizationMode {
  initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
  render(audioData: AudioData, timestamp: number): void;
  cleanup(): void;
}

export class AIImageVisualization implements VisualizationMode {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  private state: AIImageState = {
    imageURL: '',
    opacity: 0.8,
    blendMode: 'normal',
    updateInterval: 30000, // 30 seconds between updates
  };
  
  private colorScheme: ColorScheme = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFD93D',
  };
  
  // Image handling
  private currentImage: HTMLImageElement | null = null;
  private imageLoaded = false;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  
  // Generation state
  private lastGenerationTime = 0;
  private isGenerating = false;
  private generationFailed = false;
  private lastAudioFeatures: string = '';
  
  // Fallback gradient for when no image is available
  private fallbackGradient: [string, string] = ['#1a1a2e', '#16213e'];

  /**
   * Initialize the AI image visualization
   * @param canvas - The canvas element to render to
   * @param ctx - The 2D rendering context
   */
  public initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lastGenerationTime = 0;
    
    // Set fallback gradient from color scheme
    this.fallbackGradient = [this.colorScheme.primary, this.colorScheme.secondary];
  }

  /**
   * Set the color scheme (used for fallback gradient)
   * @param colorScheme - The color scheme to use
   */
  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
    this.fallbackGradient = [colorScheme.primary, colorScheme.secondary];
  }

  /**
   * Set the image opacity
   * @param opacity - Opacity value (0-1)
   */
  public setOpacity(opacity: number): void {
    this.state.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Set the blend mode for image compositing
   * @param blendMode - CSS blend mode (e.g., 'normal', 'multiply', 'screen', 'overlay')
   */
  public setBlendMode(blendMode: string): void {
    this.state.blendMode = blendMode;
  }

  /**
   * Set the update interval for image generation
   * @param intervalMs - Interval in milliseconds
   */
  public setUpdateInterval(intervalMs: number): void {
    this.state.updateInterval = Math.max(5000, intervalMs); // Minimum 5 seconds
  }

  /**
   * Manually trigger image generation
   * @param audioData - Current audio data for generation prompt
   */
  public async generateImage(audioData: AudioData): Promise<void> {
    if (this.isGenerating) {
      return;
    }

    this.isGenerating = true;
    this.generationFailed = false;

    try {
      // Create a prompt based on audio features
      const prompt = this.createPromptFromAudio(audioData);
      
      // Check cache first
      const cachedImage = this.imageCache.get(prompt);
      if (cachedImage) {
        this.currentImage = cachedImage;
        this.imageLoaded = true;
        this.state.imageURL = cachedImage.src;
        this.isGenerating = false;
        return;
      }

      // Generate image using AI provider
      const imageURL = await this.generateImageWithAI(prompt);
      
      // Load the generated image
      await this.loadImage(imageURL);
      
      // Cache the image
      if (this.currentImage) {
        this.imageCache.set(prompt, this.currentImage);
        
        // Limit cache size to prevent memory issues
        if (this.imageCache.size > 10) {
          const firstKey = this.imageCache.keys().next().value;
          this.imageCache.delete(firstKey);
        }
      }
      
      this.lastGenerationTime = performance.now();
    } catch (error) {
      console.error('[AIImageVisualization] Image generation failed:', error);
      this.handleGenerationFailure();
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Render the AI image visualization
   * @param audioData - Current audio analysis data
   * @param timestamp - Current timestamp in milliseconds
   */
  public render(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) {
      return;
    }

    // Check if we should generate a new image
    const timeSinceLastGeneration = timestamp - this.lastGenerationTime;
    const audioFeaturesKey = this.getAudioFeaturesKey(audioData);
    
    if (
      !this.imageLoaded &&
      !this.isGenerating &&
      !this.generationFailed &&
      (timeSinceLastGeneration > this.state.updateInterval || this.lastGenerationTime === 0)
    ) {
      // Trigger generation asynchronously
      this.generateImage(audioData).catch(err => {
        console.error('[AIImageVisualization] Failed to generate image:', err);
      });
    } else if (
      this.imageLoaded &&
      audioFeaturesKey !== this.lastAudioFeatures &&
      timeSinceLastGeneration > this.state.updateInterval &&
      !this.isGenerating
    ) {
      // Audio features changed significantly, generate new image
      this.lastAudioFeatures = audioFeaturesKey;
      this.generateImage(audioData).catch(err => {
        console.error('[AIImageVisualization] Failed to generate image:', err);
      });
    }

    // Render current state
    if (this.imageLoaded && this.currentImage) {
      this.renderImage();
    } else {
      this.renderFallback();
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.canvas = null;
    this.ctx = null;
    this.currentImage = null;
    this.imageCache.clear();
    this.imageLoaded = false;
    this.isGenerating = false;
  }

  /**
   * Get current AI image state
   */
  public getState(): AIImageState {
    return { ...this.state };
  }

  // Private methods

  /**
   * Create a prompt for AI image generation based on audio features
   * @param audioData - Current audio data
   * @returns Prompt string
   */
  private createPromptFromAudio(audioData: AudioData): string {
    const { bpm, energy } = audioData;
    
    // Determine mood based on BPM and energy
    let mood = 'calm';
    if (bpm > 140 && energy > 0.7) {
      mood = 'energetic and intense';
    } else if (bpm > 120 && energy > 0.5) {
      mood = 'upbeat and lively';
    } else if (bpm < 80 && energy < 0.4) {
      mood = 'melancholic and contemplative';
    } else if (energy > 0.6) {
      mood = 'dynamic and vibrant';
    }
    
    // Create abstract visual prompt
    const prompt = `Abstract visual art representing ${mood} music, flowing colors, ethereal atmosphere, digital art style`;
    
    return prompt;
  }

  /**
   * Generate an image using the configured AI provider
   * @param prompt - Text prompt for image generation
   * @returns Promise resolving to image URL
   */
  private async generateImageWithAI(prompt: string): Promise<string> {
    // Note: This is a placeholder implementation
    // In a real implementation, this would call the AI provider service
    // For now, we'll simulate with a delay and return a placeholder
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For development, return a placeholder or throw error to test fallback
    // In production, this would integrate with Ollama/Bedrock for image generation
    throw new Error('AI image generation not yet implemented - using fallback');
  }

  /**
   * Load an image from a URL
   * @param imageURL - URL of the image to load
   * @returns Promise that resolves when image is loaded
   */
  private async loadImage(imageURL: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.currentImage = img;
        this.imageLoaded = true;
        this.state.imageURL = imageURL;
        resolve();
      };
      
      img.onerror = (error) => {
        reject(new Error('Failed to load generated image'));
      };
      
      img.src = imageURL;
    });
  }

  /**
   * Handle image generation failure gracefully
   */
  private handleGenerationFailure(): void {
    this.generationFailed = true;
    this.imageLoaded = false;
    
    // Reset after a delay to allow retry
    setTimeout(() => {
      this.generationFailed = false;
    }, 30000); // Retry after 30 seconds
  }

  /**
   * Render the current image to the canvas
   */
  private renderImage(): void {
    if (!this.ctx || !this.canvas || !this.currentImage) {
      return;
    }

    const { width, height } = this.canvas;
    
    // Save context state
    this.ctx.save();
    
    // Set opacity
    this.ctx.globalAlpha = this.state.opacity;
    
    // Set blend mode
    this.ctx.globalCompositeOperation = this.state.blendMode as GlobalCompositeOperation;
    
    // Draw image scaled to fit canvas
    this.ctx.drawImage(this.currentImage, 0, 0, width, height);
    
    // Restore context state
    this.ctx.restore();
  }

  /**
   * Render fallback gradient when no image is available
   */
  private renderFallback(): void {
    if (!this.ctx || !this.canvas) {
      return;
    }

    const { width, height } = this.canvas;
    
    // Create a simple gradient as fallback
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, this.fallbackGradient[0]);
    gradient.addColorStop(1, this.fallbackGradient[1]);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    
    // Add a subtle message if generation failed
    if (this.generationFailed) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('AI image generation unavailable - using fallback', width / 2, height / 2);
    }
  }

  /**
   * Get a key representing current audio features for caching
   * @param audioData - Current audio data
   * @returns Feature key string
   */
  private getAudioFeaturesKey(audioData: AudioData): string {
    const { bpm, energy } = audioData;
    
    // Round values to reduce cache misses from minor variations
    const roundedBPM = Math.round(bpm / 10) * 10;
    const roundedEnergy = Math.round(energy * 10) / 10;
    
    return `bpm:${roundedBPM}-energy:${roundedEnergy}`;
  }
}
