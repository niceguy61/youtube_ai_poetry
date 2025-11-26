/**
 * EqualizerVisualization - Frequency bar visualization
 * 
 * Implements a frequency equalizer display that shows audio spectrum data
 * as animated bars. The bars respond to frequency data in real-time and
 * overlay on top of existing background visualizations.
 * 
 * Requirements: 2.8, 12.3
 */

import type { AudioData } from '../../types/audio';
import type { ColorScheme, EqualizerState } from '../../types/visualization';

export interface VisualizationMode {
  initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
  render(audioData: AudioData, timestamp: number): void;
  cleanup(): void;
}

export class EqualizerVisualization implements VisualizationMode {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  private state: EqualizerState = {
    barCount: 64,
    barWidth: 0, // Calculated based on canvas width
    barSpacing: 2,
    smoothing: 0.7,
    colorGradient: ['#FF6B6B', '#4ECDC4', '#FFD93D'],
  };
  
  private colorScheme: ColorScheme = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFD93D',
  };
  
  // Smoothing state - stores previous bar heights
  private previousHeights: number[] = [];
  
  // Rendering configuration
  private maxBarHeight = 0; // Calculated based on canvas height

  /**
   * Initialize the equalizer visualization
   * @param canvas - The canvas element to render to
   * @param ctx - The 2D rendering context
   */
  public initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Calculate bar dimensions based on canvas size
    this.updateDimensions();
    
    // Initialize previous heights array
    this.previousHeights = new Array(this.state.barCount).fill(0);
    
    // Initialize color gradient from color scheme
    this.state.colorGradient = [
      this.colorScheme.primary,
      this.colorScheme.secondary,
      this.colorScheme.accent,
    ];
  }

  /**
   * Set the color scheme for the equalizer
   * @param colorScheme - The color scheme to use
   */
  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
    this.state.colorGradient = [
      colorScheme.primary,
      colorScheme.secondary,
      colorScheme.accent,
    ];
  }

  /**
   * Set the number of frequency bars
   * @param count - Number of bars to display
   */
  public setBarCount(count: number): void {
    this.state.barCount = Math.max(8, Math.min(256, count)); // Clamp between 8 and 256
    this.updateDimensions();
    this.previousHeights = new Array(this.state.barCount).fill(0);
  }

  /**
   * Set the smoothing factor for bar animations
   * @param smoothing - Smoothing factor (0-1, higher = smoother)
   */
  public setSmoothing(smoothing: number): void {
    this.state.smoothing = Math.max(0, Math.min(1, smoothing)); // Clamp between 0 and 1
  }

  /**
   * Render the equalizer visualization
   * @param audioData - Current audio analysis data
   * @param timestamp - Current timestamp in milliseconds
   */
  public render(audioData: AudioData, timestamp: number): void {
    if (!this.ctx || !this.canvas) {
      return;
    }
    
    const { frequencyData } = audioData;
    
    // Calculate bar heights from frequency data
    const barHeights = this.calculateBarHeights(frequencyData);
    
    // Apply smoothing algorithm
    const smoothedHeights = this.applySmoothingAlgorithm(barHeights);
    
    // Render the bars
    this.renderBars(smoothedHeights);
    
    // Update previous heights for next frame
    this.previousHeights = smoothedHeights;
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.canvas = null;
    this.ctx = null;
    this.previousHeights = [];
  }

  /**
   * Get current equalizer state
   */
  public getState(): EqualizerState {
    return { ...this.state };
  }

  // Private methods

  /**
   * Update bar dimensions based on canvas size
   */
  private updateDimensions(): void {
    if (!this.canvas) {
      return;
    }
    
    const { width, height } = this.canvas;
    
    // Calculate bar width to fill entire width
    // Use exact division without floor to prevent gaps
    const totalSpacing = this.state.barSpacing * (this.state.barCount - 1);
    const availableWidth = width - totalSpacing;
    this.state.barWidth = availableWidth / this.state.barCount;
    
    // Reserve some space at top and bottom
    this.maxBarHeight = height * 0.8;
  }

  /**
   * Calculate bar heights from frequency data
   * @param frequencyData - Raw frequency data from audio analyzer
   * @returns Array of bar heights (0-1 normalized)
   */
  private calculateBarHeights(frequencyData: Uint8Array): number[] {
    const barHeights: number[] = [];
    
    // Determine how many frequency bins to average per bar
    const binsPerBar = Math.floor(frequencyData.length / this.state.barCount);
    
    for (let i = 0; i < this.state.barCount; i++) {
      const startBin = i * binsPerBar;
      const endBin = Math.min(startBin + binsPerBar, frequencyData.length);
      
      // Average the frequency values in this range
      let sum = 0;
      for (let j = startBin; j < endBin; j++) {
        sum += frequencyData[j];
      }
      
      const average = sum / (endBin - startBin);
      
      // Normalize to 0-1 range (frequency data is 0-255)
      const normalized = average / 255;
      
      barHeights.push(normalized);
    }
    
    return barHeights;
  }

  /**
   * Apply smoothing algorithm to bar heights
   * @param currentHeights - Current frame bar heights
   * @returns Smoothed bar heights
   */
  private applySmoothingAlgorithm(currentHeights: number[]): number[] {
    const smoothedHeights: number[] = [];
    
    for (let i = 0; i < currentHeights.length; i++) {
      const current = currentHeights[i];
      const previous = this.previousHeights[i] || 0;
      
      // Apply exponential smoothing
      // Higher smoothing factor = more weight on previous value = smoother
      const smoothed = previous * this.state.smoothing + current * (1 - this.state.smoothing);
      
      smoothedHeights.push(smoothed);
    }
    
    return smoothedHeights;
  }

  /**
   * Render the frequency bars to the canvas
   * @param barHeights - Normalized bar heights (0-1)
   */
  private renderBars(barHeights: number[]): void {
    if (!this.ctx || !this.canvas) {
      return;
    }
    
    const { height } = this.canvas;
    
    // Note: We don't clear the canvas here because equalizer overlays on background
    // The background visualization (gradient, etc.) should be rendered first
    
    for (let i = 0; i < barHeights.length; i++) {
      const normalizedHeight = barHeights[i];
      const barHeight = normalizedHeight * this.maxBarHeight;
      
      // Calculate bar position
      const x = i * (this.state.barWidth + this.state.barSpacing);
      const y = height - barHeight; // Bars grow from bottom
      
      // Get color from gradient based on bar position
      const color = this.getBarColor(i, barHeights.length, normalizedHeight);
      
      // Draw the bar
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, this.state.barWidth, barHeight);
    }
  }

  /**
   * Get the color for a bar based on its position and height
   * @param barIndex - Index of the bar
   * @param totalBars - Total number of bars
   * @param height - Normalized height of the bar (0-1)
   * @returns Color string
   */
  private getBarColor(barIndex: number, totalBars: number, height: number): string {
    // Interpolate between gradient colors based on bar position
    const position = barIndex / (totalBars - 1); // 0 to 1
    
    const colors = this.state.colorGradient;
    
    if (colors.length === 1) {
      return colors[0];
    }
    
    // Determine which two colors to interpolate between
    const segmentCount = colors.length - 1;
    const segment = position * segmentCount;
    const segmentIndex = Math.floor(segment);
    const segmentPosition = segment - segmentIndex;
    
    // Clamp to valid indices
    const startIndex = Math.min(segmentIndex, colors.length - 2);
    const endIndex = startIndex + 1;
    
    const startColor = colors[startIndex];
    const endColor = colors[endIndex];
    
    // Interpolate between the two colors
    return this.interpolateColor(startColor, endColor, segmentPosition);
  }

  /**
   * Interpolate between two hex colors
   * @param color1 - Start color (hex)
   * @param color2 - End color (hex)
   * @param factor - Interpolation factor (0-1)
   * @returns Interpolated color (hex)
   */
  private interpolateColor(color1: string, color2: string, factor: number): string {
    // Parse hex colors
    const c1 = this.parseHexColor(color1);
    const c2 = this.parseHexColor(color2);
    
    // Interpolate each channel
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    // Convert back to hex
    return `#${this.toHex(r)}${this.toHex(g)}${this.toHex(b)}`;
  }

  /**
   * Parse a hex color string to RGB components
   * @param hex - Hex color string (e.g., "#FF6B6B")
   * @returns RGB components
   */
  private parseHexColor(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Convert a number to a 2-digit hex string
   * @param value - Number (0-255)
   * @returns Hex string
   */
  private toHex(value: number): string {
    const hex = Math.max(0, Math.min(255, value)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }
}
