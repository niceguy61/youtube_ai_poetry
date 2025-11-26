/**
 * SpotlightVisualization - Animated spotlight effects
 * 
 * Implements animated pin lights that move across a background image
 * synchronized with the music's rhythm. Spotlights respond to audio
 * energy and BPM, creating dynamic lighting effects.
 * 
 * Requirements: 12.4
 */

import type { AudioData } from '../../types/audio';
import type { ColorScheme, Spotlight, SpotlightState } from '../../types/visualization';

export interface VisualizationMode {
  initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
  render(audioData: AudioData, timestamp: number): void;
  cleanup(): void;
}

export class SpotlightVisualization implements VisualizationMode {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  private state: SpotlightState = {
    lights: [],
    backgroundImage: undefined,
    intensity: 1.0,
  };
  
  private colorScheme: ColorScheme = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFD93D',
  };
  
  // Background image handling
  private backgroundImageElement: HTMLImageElement | null = null;
  private backgroundImageLoaded = false;
  
  // Animation state
  private lastBPM = 120; // Default BPM
  private lastUpdateTime = 0;
  
  // Configuration
  private readonly DEFAULT_LIGHT_COUNT = 5;
  private readonly MIN_RADIUS = 30;
  private readonly MAX_RADIUS = 100;
  private readonly BASE_SPEED = 1.0; // Base movement speed
  
  // AI-configurable parameters
  public aiConfig: {
    count?: number;
    speed?: number;
    radius?: [number, number];
  } = {};

  /**
   * Initialize the spotlight visualization
   * @param canvas - The canvas element to render to
   * @param ctx - The 2D rendering context
   */
  public initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.ctx = ctx;
    this.lastUpdateTime = performance.now();
    
    // Initialize spotlights
    this.initializeSpotlights();
  }

  /**
   * Set the color scheme for the spotlights
   * @param colorScheme - The color scheme to use
   */
  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
    
    // Update existing spotlight colors
    const colors = [colorScheme.primary, colorScheme.secondary, colorScheme.accent];
    this.state.lights.forEach((light, index) => {
      light.color = colors[index % colors.length];
    });
  }

  /**
   * Set the light intensity
   * @param intensity - Intensity value (0-1)
   */
  public setIntensity(intensity: number): void {
    this.state.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Load a background image
   * @param imageUrl - URL or data URL of the image
   * @returns Promise that resolves when image is loaded
   */
  public async loadBackgroundImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.backgroundImageElement = img;
        this.backgroundImageLoaded = true;
        this.state.backgroundImage = imageUrl;
        resolve();
      };
      
      img.onerror = (error) => {
        console.error('[SpotlightVisualization] Failed to load background image:', error);
        this.backgroundImageLoaded = false;
        reject(new Error('Failed to load background image'));
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Clear the background image
   */
  public clearBackgroundImage(): void {
    this.backgroundImageElement = null;
    this.backgroundImageLoaded = false;
    this.state.backgroundImage = undefined;
  }

  /**
   * Render the spotlight visualization
   * @param audioData - Current audio analysis data
   * @param timestamp - Current timestamp in milliseconds
   */
  public render(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) {
      return;
    }
    
    const { bpm, energy } = audioData;
    
    // Update BPM if it has changed significantly
    if (Math.abs(bpm - this.lastBPM) > 5) {
      this.lastBPM = bpm;
    }
    
    // Calculate delta time for smooth animation
    const deltaTime = timestamp - this.lastUpdateTime;
    this.lastUpdateTime = timestamp;
    
    // Don't render background - VisualizationEngine handles it
    // Just update and render spotlights
    
    // Update spotlight positions based on rhythm
    this.updateSpotlightPositions(deltaTime, this.lastBPM, energy);
    
    // Render spotlights
    this.renderSpotlights(energy);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.canvas = null;
    this.ctx = null;
    this.backgroundImageElement = null;
    this.backgroundImageLoaded = false;
    this.state.lights = [];
  }

  /**
   * Get current spotlight state
   */
  public getState(): SpotlightState {
    return {
      ...this.state,
      lights: this.state.lights.map(light => ({ ...light })),
    };
  }

  // Private methods

  /**
   * Initialize spotlights with random positions and velocities
   */
  private initializeSpotlights(): void {
    if (!this.canvas) {
      return;
    }
    
    const { width, height } = this.canvas;
    const colors = [this.colorScheme.primary, this.colorScheme.secondary, this.colorScheme.accent];
    
    // Use AI config if available
    const lightCount = this.aiConfig.count || this.DEFAULT_LIGHT_COUNT;
    const minRadius = this.aiConfig.radius?.[0] || this.MIN_RADIUS;
    const maxRadius = this.aiConfig.radius?.[1] || this.MAX_RADIUS;
    
    this.state.lights = [];
    
    for (let i = 0; i < lightCount; i++) {
      const spotlight: Spotlight = {
        position: {
          x: Math.random() * width,
          y: Math.random() * height,
        },
        radius: minRadius + Math.random() * (maxRadius - minRadius),
        color: colors[i % colors.length],
        velocity: {
          x: (Math.random() - 0.5) * this.BASE_SPEED * 2,
          y: (Math.random() - 0.5) * this.BASE_SPEED * 2,
        },
      };
      
      this.state.lights.push(spotlight);
    }
  }

  /**
   * Render the background (image or solid color)
   */
  private renderBackground(): void {
    if (!this.ctx || !this.canvas) {
      return;
    }
    
    const { width, height } = this.canvas;
    
    if (this.backgroundImageLoaded && this.backgroundImageElement) {
      // Draw background image, scaled to fit canvas
      this.ctx.drawImage(this.backgroundImageElement, 0, 0, width, height);
      
      // Add a dark overlay to make spotlights more visible
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, width, height);
    } else {
      // Draw solid dark background
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * Update spotlight positions based on rhythm and energy
   * @param deltaTime - Time elapsed since last update (ms)
   * @param bpm - Current BPM
   * @param energy - Current audio energy (0-1)
   */
  private updateSpotlightPositions(deltaTime: number, bpm: number, energy: number): void {
    if (!this.canvas) {
      return;
    }
    
    const { width, height } = this.canvas;
    
    // Calculate speed multiplier based on BPM and AI config
    // Higher BPM = faster movement
    const bpmFactor = bpm / 120; // Normalize to 120 BPM baseline
    const aiSpeedMultiplier = this.aiConfig.speed || 1.0;
    const speedMultiplier = bpmFactor * (1 + energy * 0.5) * aiSpeedMultiplier; // Apply AI speed
    
    // Convert deltaTime to seconds for consistent movement
    const dt = deltaTime / 1000;
    
    this.state.lights.forEach((light) => {
      // Update position based on velocity
      light.position.x += light.velocity.x * speedMultiplier * dt * 60; // Scale to ~60fps baseline
      light.position.y += light.velocity.y * speedMultiplier * dt * 60;
      
      // Bounce off edges
      if (light.position.x < 0 || light.position.x > width) {
        light.velocity.x *= -1;
        light.position.x = Math.max(0, Math.min(width, light.position.x));
      }
      
      if (light.position.y < 0 || light.position.y > height) {
        light.velocity.y *= -1;
        light.position.y = Math.max(0, Math.min(height, light.position.y));
      }
      
      // Occasionally add some randomness to velocity for more organic movement
      if (Math.random() < 0.01) {
        light.velocity.x += (Math.random() - 0.5) * 0.5;
        light.velocity.y += (Math.random() - 0.5) * 0.5;
        
        // Clamp velocity to reasonable range
        const maxVelocity = this.BASE_SPEED * 3;
        light.velocity.x = Math.max(-maxVelocity, Math.min(maxVelocity, light.velocity.x));
        light.velocity.y = Math.max(-maxVelocity, Math.min(maxVelocity, light.velocity.y));
      }
    });
  }

  /**
   * Render all spotlights
   * @param energy - Current audio energy (0-1)
   */
  private renderSpotlights(energy: number): void {
    if (!this.ctx) {
      return;
    }
    
    // Modulate intensity based on energy
    const effectiveIntensity = this.state.intensity * (0.5 + energy * 0.5);
    
    this.state.lights.forEach((light) => {
      this.renderSpotlight(light, effectiveIntensity);
    });
  }

  /**
   * Render a single spotlight
   * @param light - The spotlight to render
   * @param intensity - Effective intensity (0-1)
   */
  private renderSpotlight(light: Spotlight, intensity: number): void {
    if (!this.ctx) {
      return;
    }
    
    // Create radial gradient for spotlight effect
    const gradient = this.ctx.createRadialGradient(
      light.position.x,
      light.position.y,
      0,
      light.position.x,
      light.position.y,
      light.radius
    );
    
    // Parse color and add alpha
    const color = this.parseColor(light.color);
    
    // Center is bright
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`);
    
    // Mid-point has some glow
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.4})`);
    
    // Edge fades to transparent
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    // Draw the spotlight
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      light.position.x - light.radius,
      light.position.y - light.radius,
      light.radius * 2,
      light.radius * 2
    );
  }

  /**
   * Parse a hex color to RGB components
   * @param hex - Hex color string (e.g., "#FF6B6B")
   * @returns RGB components
   */
  private parseColor(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
  }
}
