/**
 * Audio-related type definitions
 */

export interface AudioSource {
  buffer: AudioBuffer;
  duration: number;
  metadata: AudioMetadata;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  sourceType: 'file' | 'url' | 'youtube';
  thumbnailUrl?: string; // YouTube thumbnail URL
  analysis?: AudioAnalysisResult; // Comprehensive audio analysis from librosa
}

export interface AudioAnalysisResult {
  duration: number;
  tempo: number;
  key: string;
  energy: number;
  energy_variance: number;
  spectral_centroid: number;
  spectral_centroid_variance: number;
  spectral_rolloff: number;
  zero_crossing_rate: number;
  mfcc_mean: number[];
  mfcc_variance: number[];
  valence: number; // Emotional positivity (0-1)
  intensity: number; // Musical intensity (0-1)
  complexity: number; // Musical complexity (0-1)
  mood: string; // Mood classification
}

export interface AudioFeatures {
  tempo: number;
  key?: string;
  energy: number;
  valence: number; // Emotional positivity
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[]; // Mel-frequency cepstral coefficients
  mood?: string; // Mood classification from librosa
  intensity?: number; // Musical intensity from librosa
  complexity?: number; // Musical complexity from librosa
}

export interface AudioFrame {
  timestamp: number;
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  rms: number; // Root mean square (volume)
  peak: number;
}

export interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bpm: number;
  energy: number;
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export interface ValidationResult {
  isValid: boolean;
  duration: number;
  message?: string;
}
