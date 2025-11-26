/**
 * Tests for Template Fallback Provider
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateFallbackProvider } from './TemplateFallbackProvider';
import type { AudioFeatures, PoetryStyle } from '../types';

describe('TemplateFallbackProvider', () => {
  let provider: TemplateFallbackProvider;

  beforeEach(() => {
    provider = new TemplateFallbackProvider();
  });

  describe('initialization', () => {
    it('should initialize with templates', () => {
      const moods = provider.getAvailableMoods();
      expect(moods.length).toBeGreaterThan(0);
    });

    it('should have templates for common moods', () => {
      const moods = provider.getAvailableMoods();
      expect(moods).toContain('joyful');
      expect(moods).toContain('energetic');
      expect(moods).toContain('melancholic');
      expect(moods).toContain('calm');
      expect(moods).toContain('dramatic');
    });
  });

  describe('generateFromAudioFeatures', () => {
    it('should generate poetry from joyful audio features', () => {
      const features: AudioFeatures = {
        tempo: 130,
        energy: 0.8,
        valence: 0.7,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        zeroCrossingRate: 0.1,
        mfcc: [1, 2, 3],
      };

      const poetry = provider.generateFromAudioFeatures(features);
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
      expect(poetry.length).toBeGreaterThan(0);
    });

    it('should generate poetry from melancholic audio features', () => {
      const features: AudioFeatures = {
        tempo: 70,
        energy: 0.2,
        valence: 0.3,
        spectralCentroid: 1000,
        spectralRolloff: 2000,
        zeroCrossingRate: 0.05,
        mfcc: [1, 2, 3],
      };

      const poetry = provider.generateFromAudioFeatures(features);
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should generate poetry from calm audio features', () => {
      const features: AudioFeatures = {
        tempo: 80,
        energy: 0.2,
        valence: 0.7,
        spectralCentroid: 1500,
        spectralRolloff: 3000,
        zeroCrossingRate: 0.06,
        mfcc: [1, 2, 3],
      };

      const poetry = provider.generateFromAudioFeatures(features);
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should generate poetry from energetic audio features', () => {
      const features: AudioFeatures = {
        tempo: 150,
        energy: 0.9,
        valence: 0.3,
        spectralCentroid: 3000,
        spectralRolloff: 5000,
        zeroCrossingRate: 0.15,
        mfcc: [1, 2, 3],
      };

      const poetry = provider.generateFromAudioFeatures(features);
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should respect poetry style when provided', () => {
      const features: AudioFeatures = {
        tempo: 100,
        energy: 0.5,
        valence: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        zeroCrossingRate: 0.1,
        mfcc: [1, 2, 3],
      };

      const style: PoetryStyle = {
        tone: 'calm',
        length: 'short',
        structure: 'free-verse',
      };

      const poetry = provider.generateFromAudioFeatures(features, style);
      expect(poetry).toBeTruthy();
      
      // Short style should have fewer lines
      const lines = poetry.split('\n');
      expect(lines.length).toBeLessThanOrEqual(4);
    });
  });

  describe('generateFromMood', () => {
    it('should generate poetry for joyful mood', () => {
      const poetry = provider.generateFromMood('joyful');
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should generate poetry for melancholic mood', () => {
      const poetry = provider.generateFromMood('melancholic');
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should generate poetry for calm mood', () => {
      const poetry = provider.generateFromMood('calm');
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should generate poetry for dramatic mood', () => {
      const poetry = provider.generateFromMood('dramatic');
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should handle unknown moods gracefully', () => {
      const poetry = provider.generateFromMood('unknown-mood-xyz');
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
      // Should fallback to a default mood
    });

    it('should handle partial mood matches', () => {
      const poetry = provider.generateFromMood('happy and joyful');
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });

    it('should handle mood keywords', () => {
      const poetry = provider.generateFromMood('sad and lonely');
      expect(poetry).toBeTruthy();
      expect(typeof poetry).toBe('string');
    });
  });

  describe('getTemplatesForMood', () => {
    it('should return templates for a valid mood', () => {
      const templates = provider.getTemplatesForMood('joyful');
      expect(templates.length).toBeGreaterThan(0);
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should return empty array for invalid mood', () => {
      const templates = provider.getTemplatesForMood('invalid-mood-xyz');
      expect(templates).toEqual([]);
    });

    it('should return different templates for different moods', () => {
      const joyfulTemplates = provider.getTemplatesForMood('joyful');
      const melancholicTemplates = provider.getTemplatesForMood('melancholic');
      
      expect(joyfulTemplates).not.toEqual(melancholicTemplates);
    });

    it('should have multiple templates per mood', () => {
      const templates = provider.getTemplatesForMood('calm');
      expect(templates.length).toBeGreaterThan(1);
    });
  });

  describe('template variety', () => {
    it('should return different templates on multiple calls', () => {
      const features: AudioFeatures = {
        tempo: 100,
        energy: 0.5,
        valence: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        zeroCrossingRate: 0.1,
        mfcc: [1, 2, 3],
      };

      const results = new Set<string>();
      
      // Generate multiple times
      for (let i = 0; i < 20; i++) {
        const poetry = provider.generateFromAudioFeatures(features);
        results.add(poetry);
      }

      // Should have some variety (at least 2 different templates)
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    it('should handle extreme energy values', () => {
      const features: AudioFeatures = {
        tempo: 100,
        energy: 1.0,
        valence: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        zeroCrossingRate: 0.1,
        mfcc: [1, 2, 3],
      };

      const poetry = provider.generateFromAudioFeatures(features);
      expect(poetry).toBeTruthy();
    });

    it('should handle extreme tempo values', () => {
      const features: AudioFeatures = {
        tempo: 200,
        energy: 0.5,
        valence: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        zeroCrossingRate: 0.1,
        mfcc: [1, 2, 3],
      };

      const poetry = provider.generateFromAudioFeatures(features);
      expect(poetry).toBeTruthy();
    });

    it('should handle zero values', () => {
      const features: AudioFeatures = {
        tempo: 0,
        energy: 0,
        valence: 0,
        spectralCentroid: 0,
        spectralRolloff: 0,
        zeroCrossingRate: 0,
        mfcc: [],
      };

      const poetry = provider.generateFromAudioFeatures(features);
      expect(poetry).toBeTruthy();
    });
  });

  describe('style adjustments', () => {
    it('should adjust for short length', () => {
      const features: AudioFeatures = {
        tempo: 100,
        energy: 0.5,
        valence: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        zeroCrossingRate: 0.1,
        mfcc: [1, 2, 3],
      };

      const shortStyle: PoetryStyle = {
        tone: 'calm',
        length: 'short',
        structure: 'free-verse',
      };

      const poetry = provider.generateFromAudioFeatures(features, shortStyle);
      const lines = poetry.split('\n');
      
      // Short should be 4 lines or fewer
      expect(lines.length).toBeLessThanOrEqual(4);
    });

    it('should handle long length style', () => {
      const features: AudioFeatures = {
        tempo: 100,
        energy: 0.5,
        valence: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        zeroCrossingRate: 0.1,
        mfcc: [1, 2, 3],
      };

      const longStyle: PoetryStyle = {
        tone: 'dramatic',
        length: 'long',
        structure: 'free-verse',
      };

      const poetry = provider.generateFromAudioFeatures(features, longStyle);
      expect(poetry).toBeTruthy();
      // Long style returns template as-is since we can't extend templates
    });
  });
});
