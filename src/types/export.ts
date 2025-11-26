/**
 * Export and sharing related type definitions
 */

import type { CanvasElement } from './canvas';
import type { VisualizationConfig } from './visualization';

export interface ExperienceData {
  audioSource: {
    type: 'file' | 'url' | 'youtube';
    reference: string;
  };
  poems: string[];
  canvasState: CanvasElement[];
  visualizationConfig: VisualizationConfig;
  timestamp: number;
}

export interface YouTubeVideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  author: string;
}

export type AnalysisStage = 
  | 'loading'
  | 'validating'
  | 'analyzing'
  | 'generating'
  | 'ready';

export type NarrativeStyle = 
  | 'minimal'
  | 'descriptive'
  | 'poetic'
  | 'technical';

export interface ExperienceSummary {
  duration: number;
  poemsGenerated: number;
  interactionsCount: number;
  visualizationMode: string;
  highlights: string[];
}
