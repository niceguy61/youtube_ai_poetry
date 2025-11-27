/**
 * Poetry generation related type definitions
 */

import type { AudioFeatures } from './audio';
import type { Persona } from './persona';
import type { Language } from './language';

export type AIProvider = 'ollama' | 'bedrock' | 'openai';

export interface PoetryStyle {
  tone: 'melancholic' | 'joyful' | 'energetic' | 'calm' | 'dramatic';
  length: 'short' | 'medium' | 'long';
  structure: 'free-verse' | 'haiku' | 'sonnet' | 'prose';
}

export interface Poem {
  id: string;
  text: string;
  timestamp: number;
  audioFeatures: AudioFeatures;
  style: PoetryStyle;
  source: AIProvider;
}

export interface PoetryRequest {
  audioFeatures: AudioFeatures;
  style: PoetryStyle;
  context?: string;
  previousPoems?: string[];
}

export interface GenerationOptions {
  temperature: number;
  maxTokens: number;
  topP?: number;
  stopSequences?: string[];
}

export interface ProviderConfig {
  ollama?: {
    endpoint: string;
    model: string;
  };
  bedrock?: {
    region: string;
    modelId: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  openai?: {
    apiKey: string;
    model?: string;
  };
}

export interface PoetryGeneratorConfig {
  persona: Persona;
  language: Language;
  provider: 'ollama' | 'openai' | 'bedrock';
  model?: string;
  apiKey?: string;
}

export interface ResourceStatus {
  available: boolean;
  gpuMemory?: number;
  gpuUtilization?: number;
  message?: string;
}
