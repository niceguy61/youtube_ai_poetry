/**
 * AudioAnalyzer Service
 * 
 * Extracts audio features in real-time using Web Audio API.
 * Provides frequency data, time domain data, BPM detection, energy calculation,
 * and comprehensive feature extraction for AI poetry generation.
 */

import type { AudioFeatures, AudioData } from '../types/audio';
import { CONFIG } from '../config/config';

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private timeDomainData: Uint8Array<ArrayBuffer> | null = null;
  private initialized = false;

  /**
   * Initialize the analyzer with audio context and source
   */
  initialize(audioContext: AudioContext, source: AudioBufferSourceNode | MediaElementAudioSourceNode): void {
    if (this.initialized) {
      this.disconnect();
    }

    this.audioContext = audioContext;
    this.sourceNode = source;

    // Create and configure analyser node
    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = CONFIG.audio.FFT_SIZE;
    this.analyserNode.smoothingTimeConstant = CONFIG.audio.SMOOTHING_TIME_CONSTANT;
    this.analyserNode.minDecibels = CONFIG.audio.MIN_DECIBELS;
    this.analyserNode.maxDecibels = CONFIG.audio.MAX_DECIBELS;

    // Connect audio graph: source -> analyser -> destination
    source.connect(this.analyserNode);
    this.analyserNode.connect(audioContext.destination);

    // Initialize data arrays
    const bufferLength = this.analyserNode.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
    this.timeDomainData = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;

    this.initialized = true;
  }

  /**
   * Get current frequency data (spectrum analysis)
   */
  getFrequencyData(): Uint8Array {
    this.ensureInitialized();
    
    if (this.analyserNode && this.frequencyData) {
      this.analyserNode.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    
    return new Uint8Array(0);
  }

  /**
   * Get current time domain data (waveform)
   */
  getTimeDomainData(): Uint8Array {
    this.ensureInitialized();
    
    if (this.analyserNode && this.timeDomainData) {
      this.analyserNode.getByteTimeDomainData(this.timeDomainData);
      return this.timeDomainData;
    }
    
    return new Uint8Array(0);
  }

  /**
   * Calculate BPM (Beats Per Minute) using peak detection
   */
  getBPM(): number {
    this.ensureInitialized();
    
    if (!this.analyserNode || !this.timeDomainData) {
      return 0;
    }

    // Get time domain data for peak detection
    this.analyserNode.getByteTimeDomainData(this.timeDomainData);
    
    // Detect peaks in the waveform
    const peaks = this.detectPeaks(this.timeDomainData);
    
    if (peaks.length < 2) {
      return 120; // Default BPM if detection fails
    }

    // Calculate average interval between peaks
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    
    // Convert interval to BPM
    // Sample rate / FFT size gives us time per sample
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const timePerSample = 1 / sampleRate;
    const intervalInSeconds = avgInterval * timePerSample;
    
    if (intervalInSeconds === 0) {
      return 120;
    }

    const bpm = 60 / intervalInSeconds;
    
    // Clamp to reasonable range (40-200 BPM)
    return Math.max(40, Math.min(200, Math.round(bpm)));
  }

  /**
   * Calculate energy (RMS - Root Mean Square)
   */
  getEnergy(): number {
    this.ensureInitialized();
    
    if (!this.analyserNode || !this.timeDomainData) {
      return 0;
    }

    this.analyserNode.getByteTimeDomainData(this.timeDomainData);
    
    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < this.timeDomainData.length; i++) {
      const normalized = (this.timeDomainData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    
    const rms = Math.sqrt(sum / this.timeDomainData.length);
    
    // Normalize to 0-1 range
    return Math.min(1, rms * 2);
  }

  /**
   * Extract comprehensive audio features for AI poetry generation
   */
  extractFeatures(): AudioFeatures {
    this.ensureInitialized();
    
    const tempo = this.getBPM();
    const energy = this.getEnergy();
    const spectralCentroid = this.calculateSpectralCentroid();
    const spectralRolloff = this.calculateSpectralRolloff();
    const zeroCrossingRate = this.calculateZeroCrossingRate();
    const mfcc = this.calculateMFCC();
    const valence = this.estimateValence(energy, spectralCentroid);

    return {
      tempo,
      energy,
      valence,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc,
      key: this.estimateKey()
    };
  }

  /**
   * Disconnect and cleanup audio nodes
   */
  disconnect(): void {
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.audioContext = null;
    this.frequencyData = null;
    this.timeDomainData = null;
    this.initialized = false;
  }

  /**
   * Check if the analyzer is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Detect peaks in time domain data for BPM calculation
   */
  private detectPeaks(data: Uint8Array, threshold: number = 150): number[] {
    const peaks: number[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      // Check if current sample is a local maximum above threshold
      if (data[i] > threshold && 
          data[i] > data[i - 1] && 
          data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  /**
   * Calculate spectral centroid (brightness of sound)
   */
  private calculateSpectralCentroid(): number {
    if (!this.analyserNode || !this.frequencyData) {
      return 0;
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData);
    
    let weightedSum = 0;
    let sum = 0;
    
    for (let i = 0; i < this.frequencyData.length; i++) {
      weightedSum += i * this.frequencyData[i];
      sum += this.frequencyData[i];
    }
    
    if (sum === 0) {
      return 0;
    }
    
    // Normalize to 0-1 range
    return (weightedSum / sum) / this.frequencyData.length;
  }

  /**
   * Calculate spectral rolloff (frequency below which 85% of energy is contained)
   */
  private calculateSpectralRolloff(): number {
    if (!this.analyserNode || !this.frequencyData) {
      return 0;
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData);
    
    // Calculate total energy
    let totalEnergy = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      totalEnergy += this.frequencyData[i];
    }
    
    const threshold = totalEnergy * 0.85;
    let cumulativeEnergy = 0;
    
    // Find frequency bin where 85% of energy is reached
    for (let i = 0; i < this.frequencyData.length; i++) {
      cumulativeEnergy += this.frequencyData[i];
      if (cumulativeEnergy >= threshold) {
        // Normalize to 0-1 range
        return i / this.frequencyData.length;
      }
    }
    
    return 1;
  }

  /**
   * Calculate zero crossing rate (percussiveness indicator)
   */
  private calculateZeroCrossingRate(): number {
    if (!this.analyserNode || !this.timeDomainData) {
      return 0;
    }

    this.analyserNode.getByteTimeDomainData(this.timeDomainData);
    
    let crossings = 0;
    const centerline = 128; // Zero point in byte data
    
    for (let i = 1; i < this.timeDomainData.length; i++) {
      const prev = this.timeDomainData[i - 1] - centerline;
      const curr = this.timeDomainData[i] - centerline;
      
      // Check if sign changed (zero crossing)
      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        crossings++;
      }
    }
    
    // Normalize to 0-1 range
    return crossings / this.timeDomainData.length;
  }

  /**
   * Calculate simplified MFCC (Mel-frequency cepstral coefficients)
   * This is a simplified version for timbre characteristics
   */
  private calculateMFCC(): number[] {
    if (!this.analyserNode || !this.frequencyData) {
      return new Array(13).fill(0);
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData);
    
    // Simplified MFCC: divide spectrum into mel-scale bands
    const numCoefficients = 13;
    const mfcc: number[] = [];
    const bandSize = Math.floor(this.frequencyData.length / numCoefficients);
    
    for (let i = 0; i < numCoefficients; i++) {
      const start = i * bandSize;
      const end = Math.min(start + bandSize, this.frequencyData.length);
      
      let bandEnergy = 0;
      for (let j = start; j < end; j++) {
        bandEnergy += this.frequencyData[j];
      }
      
      // Normalize and apply log scale
      const avgEnergy = bandEnergy / bandSize;
      mfcc.push(Math.log(avgEnergy + 1) / Math.log(256));
    }
    
    return mfcc;
  }

  /**
   * Estimate valence (emotional positivity) from energy and spectral features
   */
  private estimateValence(energy: number, spectralCentroid: number): number {
    // Higher energy and brighter sound (higher spectral centroid) 
    // generally correlate with more positive valence
    const valence = (energy * 0.6 + spectralCentroid * 0.4);
    return Math.max(0, Math.min(1, valence));
  }

  /**
   * Estimate musical key (simplified version)
   */
  private estimateKey(): string | undefined {
    // This is a placeholder for key detection
    // Full implementation would require pitch detection and chroma analysis
    // For now, return undefined as key detection is complex
    return undefined;
  }

  /**
   * Ensure the analyzer is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AudioAnalyzer not initialized. Call initialize() first.');
    }
  }
}
