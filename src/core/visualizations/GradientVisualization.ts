/**
 * GradientVisualization - BPM-synchronized gradient background
 * 
 * Implements a two-tone gradient that animates in sync with the detected BPM.
 * The gradient angle rotates smoothly based on the beat tempo, creating a
 * dynamic visual effect that pulses with the music.
 * 
 * Requirements: 2.7, 12.2
 */

import type { AudioData } from '../../types/audio';
import type { ColorScheme, GradientState } from '../../types/visualization';

export interface VisualizationMode {
  initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
  render(audioData: AudioData, timestamp: number): void;
  cleanup(): void;
}

export class GradientVisualization implements VisualizationMode {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  private state: GradientState = {
    colors: ['#FF6B6B', '#4ECDC4'],
    angle: 0,
    animationPhase: 0,
    bpmSync: true,
  };
  
  private colorScheme: ColorScheme = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFD93D',
  };
  
  // Animation state
  private lastBPM = 120; // Default BPM
  private startTime = 0;
  private lastUpdateTime = 0;
  
  // Smoothing for transitions
  private targetAngle = 0;
  private currentAngle = 0;
  private angleSmoothingFactor = 0.1;
  
  // AI-configurable speed multiplier
  public speedMultiplier = 1.0;

  /**
   * Initialize the gradient visualization
   * @param canvas - The canvas element to render to
   * @param ctx - The 2D rendering context
   */
  public initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.ctx = ctx;
    this.startTime = performance.now();
    this.lastUpdateTime = this.startTime;
    
    // Initialize colors from color scheme
    this.state.colors = [this.colorScheme.primary, this.colorScheme.secondary];
  }

  /**
   * Set the color scheme for the gradient
   * @param colorScheme - The color scheme to use
   */
  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
    this.state.colors = [colorScheme.primary, colorScheme.secondary];
  }

  /**
   * Enable or disable BPM synchronization
   * @param enabled - Whether to sync with BPM
   */
  public setBPMSync(enabled: boolean): void {
    this.state.bpmSync = enabled;
  }

  /**
   * Render the gradient visualization
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
    
    // Calculate animation phase based on BPM
    if (this.state.bpmSync && this.lastBPM > 0) {
      this.updateAnimationPhase(timestamp, this.lastBPM);
    } else {
      // Fallback to time-based animation if no BPM
      this.updateAnimationPhase(timestamp, 60); // Default to 60 BPM
    }
    
    // Calculate target angle based on animation phase
    // One full rotation per beat cycle
    this.targetAngle = this.state.animationPhase * 2 * Math.PI;
    
    // Smooth angle transition
    this.currentAngle = this.smoothAngle(this.currentAngle, this.targetAngle);
    
    // Modulate colors based on energy
    const colors = this.modulateColors(energy);
    
    // Render the gradient
    this.renderGradient(colors, this.currentAngle);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Get current gradient state
   */
  public getState(): GradientState {
    return { ...this.state };
  }

  // Private methods

  /**
   * Update the animation phase based on BPM timing
   * @param timestamp - Current timestamp
   * @param bpm - Beats per minute
   */
  private updateAnimationPhase(timestamp: number, bpm: number): void {
    // Calculate time elapsed since start
    const elapsedTime = (timestamp - this.startTime) / 1000; // Convert to seconds
    
    // Calculate beats elapsed with AI speed multiplier
    const beatsPerSecond = (bpm / 60) * this.speedMultiplier;
    const beatsElapsed = elapsedTime * beatsPerSecond;
    
    // Animation phase is the fractional part of beats elapsed
    // This gives us a value between 0 and 1 that cycles with each beat
    // Use Math.abs to handle negative values and ensure positive modulo
    const phase = beatsElapsed % 1;
    this.state.animationPhase = phase < 0 ? phase + 1 : phase;
  }

  /**
   * Smooth angle transition to avoid jarring jumps
   * @param current - Current angle
   * @param target - Target angle
   * @returns Smoothed angle
   */
  private smoothAngle(current: number, target: number): number {
    // Handle angle wrapping (0 to 2π)
    let diff = target - current;
    
    // Normalize difference to [-π, π]
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    
    // Apply smoothing
    return current + diff * this.angleSmoothingFactor;
  }

  /**
   * Modulate colors based on audio energy
   * @param energy - Audio energy level (0-1)
   * @returns Modulated color pair
   */
  private modulateColors(energy: number): [string, string] {
    // Use base colors from state
    const [color1, color2] = this.state.colors;
    
    // For now, return the base colors
    // Future enhancement: could adjust brightness/saturation based on energy
    return [color1, color2];
  }

  /**
   * Render the gradient to the canvas
   * @param colors - Color pair for the gradient
   * @param angle - Gradient angle in radians
   */
  private renderGradient(colors: [string, string], angle: number): void {
    if (!this.ctx || !this.canvas) {
      return;
    }
    
    const { width, height } = this.canvas;
    
    // Calculate gradient endpoints based on angle
    // The gradient line passes through the center and extends to the edges
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate the maximum distance from center to corner
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    // Calculate start and end points
    const startX = centerX - Math.cos(angle) * maxDistance;
    const startY = centerY - Math.sin(angle) * maxDistance;
    const endX = centerX + Math.cos(angle) * maxDistance;
    const endY = centerY + Math.sin(angle) * maxDistance;
    
    // Create linear gradient
    const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    // Don't clear - let VisualizationEngine handle clearing
    // Fill canvas with semi-transparent gradient to allow layering
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.globalAlpha = 1.0;
  }
}
