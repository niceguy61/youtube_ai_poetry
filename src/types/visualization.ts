/**
 * Visualization-related type definitions
 */

export type VisualizationMode = 
  | 'gradient'
  | 'equalizer'
  | 'spotlight'
  | 'combined';

export type VisualizationLayer = 
  | 'background-gradient'
  | 'equalizer-bars'
  | 'spotlight-effects'
  | 'ai-generated-image'
  | 'particles';

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface VisualizationConfig {
  colors: ColorScheme;
  sensitivity: number;
  smoothing: number;
  layers: VisualizationLayer[];
}

export interface GradientState {
  colors: [string, string];
  angle: number;
  animationPhase: number;
  bpmSync: boolean;
}

export interface EqualizerState {
  barCount: number;
  barWidth: number;
  barSpacing: number;
  smoothing: number;
  colorGradient: string[];
}

export interface Spotlight {
  position: { x: number; y: number };
  radius: number;
  color: string;
  velocity: { x: number; y: number };
}

export interface SpotlightState {
  lights: Spotlight[];
  backgroundImage?: string;
  intensity: number;
}

export interface AIImageState {
  imageURL: string;
  opacity: number;
  blendMode: string;
  updateInterval: number;
}
