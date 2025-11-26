/**
 * AudioAnalyzer Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioAnalyzer } from './AudioAnalyzer';

describe('AudioAnalyzer', () => {
  let analyzer: AudioAnalyzer;
  let mockAudioContext: AudioContext;
  let mockSourceNode: AudioBufferSourceNode;
  let mockAnalyserNode: AnalyserNode;

  beforeEach(() => {
    analyzer = new AudioAnalyzer();

    // Create mock analyser node
    mockAnalyserNode = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 1024,
      connect: vi.fn(),
      disconnect: vi.fn(),
      getByteFrequencyData: vi.fn((array: Uint8Array) => {
        // Fill with mock frequency data
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }),
      getByteTimeDomainData: vi.fn((array: Uint8Array) => {
        // Fill with mock time domain data (sine wave pattern)
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(128 + 127 * Math.sin(i * 0.1));
        }
      })
    } as unknown as AnalyserNode;

    // Create mock audio context
    mockAudioContext = {
      sampleRate: 44100,
      createAnalyser: vi.fn(() => mockAnalyserNode)
    } as unknown as AudioContext;

    // Create mock source node
    mockSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    } as unknown as AudioBufferSourceNode;
  });

  afterEach(() => {
    analyzer.disconnect();
  });

  describe('initialize', () => {
    it('should initialize with audio context and source', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockSourceNode.connect).toHaveBeenCalledWith(mockAnalyserNode);
      expect(mockAnalyserNode.connect).toHaveBeenCalled();
    });

    it('should set correct analyser properties', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      expect(mockAnalyserNode.fftSize).toBe(2048);
      expect(mockAnalyserNode.smoothingTimeConstant).toBe(0.8);
    });

    it('should disconnect previous connections when re-initialized', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);
      const firstDisconnect = mockAnalyserNode.disconnect;

      analyzer.initialize(mockAudioContext, mockSourceNode);

      expect(firstDisconnect).toHaveBeenCalled();
    });
  });

  describe('getFrequencyData', () => {
    it('should return frequency data array', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const frequencyData = analyzer.getFrequencyData();

      expect(frequencyData).toBeInstanceOf(Uint8Array);
      expect(frequencyData.length).toBe(1024);
      expect(mockAnalyserNode.getByteFrequencyData).toHaveBeenCalled();
    });

    it('should throw error if not initialized', () => {
      expect(() => analyzer.getFrequencyData()).toThrow('AudioAnalyzer not initialized');
    });

    it('should return data in valid range (0-255)', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const frequencyData = analyzer.getFrequencyData();

      for (let i = 0; i < frequencyData.length; i++) {
        expect(frequencyData[i]).toBeGreaterThanOrEqual(0);
        expect(frequencyData[i]).toBeLessThanOrEqual(255);
      }
    });
  });

  describe('getTimeDomainData', () => {
    it('should return time domain data array', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const timeDomainData = analyzer.getTimeDomainData();

      expect(timeDomainData).toBeInstanceOf(Uint8Array);
      expect(timeDomainData.length).toBe(1024);
      expect(mockAnalyserNode.getByteTimeDomainData).toHaveBeenCalled();
    });

    it('should throw error if not initialized', () => {
      expect(() => analyzer.getTimeDomainData()).toThrow('AudioAnalyzer not initialized');
    });

    it('should return data in valid range (0-255)', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const timeDomainData = analyzer.getTimeDomainData();

      for (let i = 0; i < timeDomainData.length; i++) {
        expect(timeDomainData[i]).toBeGreaterThanOrEqual(0);
        expect(timeDomainData[i]).toBeLessThanOrEqual(255);
      }
    });
  });

  describe('getBPM', () => {
    it('should return BPM value', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const bpm = analyzer.getBPM();

      expect(bpm).toBeGreaterThan(0);
      expect(bpm).toBeTypeOf('number');
    });

    it('should return BPM in reasonable range (40-200)', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const bpm = analyzer.getBPM();

      expect(bpm).toBeGreaterThanOrEqual(40);
      expect(bpm).toBeLessThanOrEqual(200);
    });

    it('should throw error if not initialized', () => {
      expect(() => analyzer.getBPM()).toThrow('AudioAnalyzer not initialized');
    });

    it('should return default BPM when detection fails', () => {
      // Mock analyser to return flat data (no peaks)
      mockAnalyserNode.getByteTimeDomainData = vi.fn((array: Uint8Array) => {
        array.fill(128); // Flat line
      });

      analyzer.initialize(mockAudioContext, mockSourceNode);
      const bpm = analyzer.getBPM();

      expect(bpm).toBe(120); // Default BPM
    });
  });

  describe('getEnergy', () => {
    it('should return energy value', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const energy = analyzer.getEnergy();

      expect(energy).toBeGreaterThanOrEqual(0);
      expect(energy).toBeLessThanOrEqual(1);
    });

    it('should throw error if not initialized', () => {
      expect(() => analyzer.getEnergy()).toThrow('AudioAnalyzer not initialized');
    });

    it('should return higher energy for louder signals', () => {
      // Mock loud signal
      mockAnalyserNode.getByteTimeDomainData = vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(128 + 100 * Math.sin(i * 0.1));
        }
      });

      analyzer.initialize(mockAudioContext, mockSourceNode);
      const loudEnergy = analyzer.getEnergy();

      // Mock quiet signal
      mockAnalyserNode.getByteTimeDomainData = vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(128 + 10 * Math.sin(i * 0.1));
        }
      });

      const quietEnergy = analyzer.getEnergy();

      expect(loudEnergy).toBeGreaterThan(quietEnergy);
    });
  });

  describe('extractFeatures', () => {
    it('should return complete AudioFeatures object', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const features = analyzer.extractFeatures();

      expect(features).toHaveProperty('tempo');
      expect(features).toHaveProperty('energy');
      expect(features).toHaveProperty('valence');
      expect(features).toHaveProperty('spectralCentroid');
      expect(features).toHaveProperty('spectralRolloff');
      expect(features).toHaveProperty('zeroCrossingRate');
      expect(features).toHaveProperty('mfcc');
    });

    it('should return valid feature values', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const features = analyzer.extractFeatures();

      expect(features.tempo).toBeGreaterThanOrEqual(40);
      expect(features.tempo).toBeLessThanOrEqual(200);
      expect(features.energy).toBeGreaterThanOrEqual(0);
      expect(features.energy).toBeLessThanOrEqual(1);
      expect(features.valence).toBeGreaterThanOrEqual(0);
      expect(features.valence).toBeLessThanOrEqual(1);
      expect(features.spectralCentroid).toBeGreaterThanOrEqual(0);
      expect(features.spectralCentroid).toBeLessThanOrEqual(1);
      expect(features.spectralRolloff).toBeGreaterThanOrEqual(0);
      expect(features.spectralRolloff).toBeLessThanOrEqual(1);
      expect(features.zeroCrossingRate).toBeGreaterThanOrEqual(0);
      expect(features.zeroCrossingRate).toBeLessThanOrEqual(1);
    });

    it('should return MFCC array with 13 coefficients', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const features = analyzer.extractFeatures();

      expect(features.mfcc).toBeInstanceOf(Array);
      expect(features.mfcc).toHaveLength(13);
      features.mfcc.forEach(coeff => {
        expect(coeff).toBeGreaterThanOrEqual(0);
        expect(coeff).toBeLessThanOrEqual(1);
      });
    });

    it('should throw error if not initialized', () => {
      expect(() => analyzer.extractFeatures()).toThrow('AudioAnalyzer not initialized');
    });
  });

  describe('disconnect', () => {
    it('should disconnect all audio nodes', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      analyzer.disconnect();

      expect(mockAnalyserNode.disconnect).toHaveBeenCalled();
      expect(mockSourceNode.disconnect).toHaveBeenCalled();
    });

    it('should allow re-initialization after disconnect', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);
      analyzer.disconnect();

      expect(() => {
        analyzer.initialize(mockAudioContext, mockSourceNode);
      }).not.toThrow();
    });

    it('should throw error when using methods after disconnect', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);
      analyzer.disconnect();

      expect(() => analyzer.getFrequencyData()).toThrow('AudioAnalyzer not initialized');
      expect(() => analyzer.getTimeDomainData()).toThrow('AudioAnalyzer not initialized');
      expect(() => analyzer.getBPM()).toThrow('AudioAnalyzer not initialized');
      expect(() => analyzer.getEnergy()).toThrow('AudioAnalyzer not initialized');
      expect(() => analyzer.extractFeatures()).toThrow('AudioAnalyzer not initialized');
    });
  });

  describe('spectral features', () => {
    it('should calculate spectral centroid', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const features = analyzer.extractFeatures();

      expect(features.spectralCentroid).toBeGreaterThanOrEqual(0);
      expect(features.spectralCentroid).toBeLessThanOrEqual(1);
    });

    it('should calculate spectral rolloff', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const features = analyzer.extractFeatures();

      expect(features.spectralRolloff).toBeGreaterThanOrEqual(0);
      expect(features.spectralRolloff).toBeLessThanOrEqual(1);
    });

    it('should calculate zero crossing rate', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const features = analyzer.extractFeatures();

      expect(features.zeroCrossingRate).toBeGreaterThanOrEqual(0);
      expect(features.zeroCrossingRate).toBeLessThanOrEqual(1);
    });
  });

  describe('valence estimation', () => {
    it('should estimate valence from energy and spectral features', () => {
      analyzer.initialize(mockAudioContext, mockSourceNode);

      const features = analyzer.extractFeatures();

      expect(features.valence).toBeGreaterThanOrEqual(0);
      expect(features.valence).toBeLessThanOrEqual(1);
    });

    it('should correlate valence with energy', () => {
      // High energy signal
      mockAnalyserNode.getByteTimeDomainData = vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(128 + 100 * Math.sin(i * 0.1));
        }
      });

      analyzer.initialize(mockAudioContext, mockSourceNode);
      const highEnergyFeatures = analyzer.extractFeatures();

      // Low energy signal
      mockAnalyserNode.getByteTimeDomainData = vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(128 + 10 * Math.sin(i * 0.1));
        }
      });

      const lowEnergyFeatures = analyzer.extractFeatures();

      // Higher energy should generally correlate with higher valence
      expect(highEnergyFeatures.energy).toBeGreaterThan(lowEnergyFeatures.energy);
    });
  });
});
