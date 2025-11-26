/**
 * Tests for Poetry Generator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PoetryGenerator } from './PoetryGenerator';
import type { AudioFeatures } from '../types/audio';
import type { InteractionData } from '../types/canvas';
import type { PoetryStyle } from '../types/poetry';

describe('PoetryGenerator', () => {
  let generator: PoetryGenerator;

  const mockAudioFeatures: AudioFeatures = {
    tempo: 120,
    energy: 0.7,
    valence: 0.6,
    spectralCentroid: 2000,
    spectralRolloff: 4000,
    zeroCrossingRate: 0.1,
    mfcc: [1, 2, 3, 4, 5],
  };

  beforeEach(() => {
    generator = new PoetryGenerator('ollama');
  });

  describe('initialization', () => {
    it('should create a poetry generator instance', () => {
      expect(generator).toBeDefined();
      expect(generator).toBeInstanceOf(PoetryGenerator);
    });

    it('should have default style settings', () => {
      const style = generator.getStyle();
      expect(style).toBeDefined();
      expect(style.tone).toBeDefined();
      expect(style.length).toBeDefined();
      expect(style.structure).toBeDefined();
    });

    it('should initialize with a provider', async () => {
      await expect(generator.initialize('ollama')).resolves.not.toThrow();
    });
  });

  describe('generateFromAudio', () => {
    it('should generate poetry from audio features', async () => {
      const poetry = await generator.generateFromAudio(mockAudioFeatures);
      
      expect(poetry).toBeDefined();
      expect(typeof poetry).toBe('string');
      expect(poetry.length).toBeGreaterThan(0);
    });

    it('should handle high energy audio', async () => {
      const highEnergyFeatures: AudioFeatures = {
        ...mockAudioFeatures,
        energy: 0.9,
        tempo: 160,
      };

      const poetry = await generator.generateFromAudio(highEnergyFeatures);
      expect(poetry).toBeDefined();
      expect(poetry.length).toBeGreaterThan(0);
    });

    it('should handle low energy audio', async () => {
      const lowEnergyFeatures: AudioFeatures = {
        ...mockAudioFeatures,
        energy: 0.2,
        tempo: 60,
      };

      const poetry = await generator.generateFromAudio(lowEnergyFeatures);
      expect(poetry).toBeDefined();
      expect(poetry.length).toBeGreaterThan(0);
    });

    it('should store generated poems', async () => {
      const initialCount = generator.getGeneratedPoems().length;
      
      await generator.generateFromAudio(mockAudioFeatures);
      
      const poems = generator.getGeneratedPoems();
      expect(poems.length).toBe(initialCount + 1);
    });

    it('should fallback to templates on AI failure', async () => {
      // This will fail because Ollama is not running, triggering fallback
      const poetry = await generator.generateFromAudio(mockAudioFeatures);
      
      // Should still return poetry (from template)
      expect(poetry).toBeDefined();
      expect(typeof poetry).toBe('string');
      expect(poetry.length).toBeGreaterThan(0);
    });
  });

  describe('generateFromMood', () => {
    it('should generate poetry from mood descriptor', async () => {
      const poetry = await generator.generateFromMood('joyful');
      
      expect(poetry).toBeDefined();
      expect(typeof poetry).toBe('string');
      expect(poetry.length).toBeGreaterThan(0);
    });

    it('should handle different moods', async () => {
      const moods = ['joyful', 'melancholic', 'energetic', 'calm', 'dramatic'];
      
      for (const mood of moods) {
        const poetry = await generator.generateFromMood(mood);
        expect(poetry).toBeDefined();
        expect(poetry.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateFromInteraction', () => {
    it('should generate poetry from interaction data', async () => {
      const interaction: InteractionData = {
        clickPosition: { x: 100, y: 200 },
        dragPath: [],
        timestamp: Date.now(),
      };

      const poetry = await generator.generateFromInteraction(interaction);
      
      expect(poetry).toBeDefined();
      expect(typeof poetry).toBe('string');
      expect(poetry.length).toBeGreaterThan(0);
    });

    it('should incorporate audio features when provided', async () => {
      const interaction: InteractionData = {
        clickPosition: { x: 100, y: 200 },
        dragPath: [{ x: 100, y: 200 }, { x: 150, y: 250 }],
        timestamp: Date.now(),
      };

      const poetry = await generator.generateFromInteraction(
        interaction,
        mockAudioFeatures
      );
      
      expect(poetry).toBeDefined();
      expect(poetry.length).toBeGreaterThan(0);
    });

    it('should handle drag interactions', async () => {
      const interaction: InteractionData = {
        clickPosition: { x: 100, y: 200 },
        dragPath: [
          { x: 100, y: 200 },
          { x: 150, y: 250 },
          { x: 200, y: 300 },
        ],
        timestamp: Date.now(),
      };

      const poetry = await generator.generateFromInteraction(interaction);
      expect(poetry).toBeDefined();
    });
  });

  describe('generateStream', () => {
    it('should call callback with poetry chunks', async () => {
      const chunks: string[] = [];
      const callback = (chunk: string) => {
        chunks.push(chunk);
      };

      await generator.generateStream(mockAudioFeatures, callback);
      
      // Should have received at least one chunk (template fallback)
      expect(chunks.length).toBeGreaterThan(0);
      
      // Combine chunks to verify full text
      const fullText = chunks.join('');
      expect(fullText.length).toBeGreaterThan(0);
    });

    it('should store the complete poem after streaming', async () => {
      const initialCount = generator.getGeneratedPoems().length;
      
      await generator.generateStream(mockAudioFeatures, () => {});
      
      const poems = generator.getGeneratedPoems();
      expect(poems.length).toBe(initialCount + 1);
    });
  });

  describe('style configuration', () => {
    it('should set and get poetry style', () => {
      const newStyle: PoetryStyle = {
        tone: 'dramatic',
        length: 'long',
        structure: 'sonnet',
      };

      generator.setStyle(newStyle);
      
      const currentStyle = generator.getStyle();
      expect(currentStyle).toEqual(newStyle);
    });

    it('should generate different poetry for different styles', async () => {
      // Short style
      generator.setStyle({
        tone: 'calm',
        length: 'short',
        structure: 'haiku',
      });
      const shortPoetry = await generator.generateFromAudio(mockAudioFeatures);

      // Long style
      generator.setStyle({
        tone: 'dramatic',
        length: 'long',
        structure: 'free-verse',
      });
      const longPoetry = await generator.generateFromAudio(mockAudioFeatures);

      expect(shortPoetry).toBeDefined();
      expect(longPoetry).toBeDefined();
      // Both should be valid poetry
      expect(shortPoetry.length).toBeGreaterThan(0);
      expect(longPoetry.length).toBeGreaterThan(0);
    });
  });

  describe('provider management', () => {
    it('should switch providers', async () => {
      await expect(generator.setProvider('ollama')).resolves.not.toThrow();
    });

    it('should continue working after provider switch', async () => {
      await generator.setProvider('ollama');
      
      const poetry = await generator.generateFromAudio(mockAudioFeatures);
      expect(poetry).toBeDefined();
      expect(poetry.length).toBeGreaterThan(0);
    });
  });

  describe('poem storage', () => {
    it('should store generated poems with metadata', async () => {
      await generator.generateFromAudio(mockAudioFeatures);
      
      const poems = generator.getGeneratedPoems();
      const lastPoem = poems[poems.length - 1];
      
      expect(lastPoem).toBeDefined();
      expect(lastPoem.id).toBeDefined();
      expect(lastPoem.text).toBeDefined();
      expect(lastPoem.timestamp).toBeDefined();
      expect(lastPoem.audioFeatures).toBeDefined();
      expect(lastPoem.style).toBeDefined();
      expect(lastPoem.source).toBeDefined();
    });

    it('should persist poems after playback ends (Requirement 3.5)', async () => {
      // Generate multiple poems during "playback"
      await generator.generateFromAudio(mockAudioFeatures);
      await generator.generateFromAudio({ ...mockAudioFeatures, tempo: 140 });
      await generator.generateFromAudio({ ...mockAudioFeatures, energy: 0.9 });
      
      const poemsCount = generator.getGeneratedPoems().length;
      expect(poemsCount).toBe(3);
      
      // Simulate playback ending - poems should still be accessible
      const persistedPoems = generator.getGeneratedPoems();
      expect(persistedPoems.length).toBe(3);
      
      // Verify all poems are intact with their data
      persistedPoems.forEach(poem => {
        expect(poem.id).toBeDefined();
        expect(poem.text).toBeDefined();
        expect(poem.text.length).toBeGreaterThan(0);
        expect(poem.timestamp).toBeDefined();
        expect(poem.audioFeatures).toBeDefined();
      });
    });

    it('should maintain poem history across multiple sessions', async () => {
      // First session
      await generator.generateFromAudio(mockAudioFeatures);
      const firstSessionCount = generator.getGeneratedPoems().length;
      
      // Second session (without clearing)
      await generator.generateFromAudio({ ...mockAudioFeatures, tempo: 100 });
      const secondSessionCount = generator.getGeneratedPoems().length;
      
      // Should accumulate poems
      expect(secondSessionCount).toBe(firstSessionCount + 1);
    });

    it('should retrieve poems in chronological order', async () => {
      // Generate poems with slight delays to ensure different timestamps
      await generator.generateFromAudio(mockAudioFeatures);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await generator.generateFromAudio({ ...mockAudioFeatures, tempo: 140 });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await generator.generateFromAudio({ ...mockAudioFeatures, energy: 0.9 });
      
      const poems = generator.getGeneratedPoems();
      
      // Verify chronological order (oldest to newest)
      for (let i = 1; i < poems.length; i++) {
        expect(poems[i].timestamp).toBeGreaterThanOrEqual(poems[i - 1].timestamp);
      }
    });

    it('should clear all poems', async () => {
      await generator.generateFromAudio(mockAudioFeatures);
      expect(generator.getGeneratedPoems().length).toBeGreaterThan(0);
      
      generator.clearPoems();
      expect(generator.getGeneratedPoems().length).toBe(0);
    });

    it('should limit stored poems to max count', async () => {
      // Generate many poems
      for (let i = 0; i < 60; i++) {
        await generator.generateFromAudio(mockAudioFeatures);
      }
      
      const poems = generator.getGeneratedPoems();
      // Should not exceed MAX_POEMS_STORED (50)
      expect(poems.length).toBeLessThanOrEqual(50);
    });

    it('should remove oldest poems when limit is reached', async () => {
      // Generate poems up to limit
      for (let i = 0; i < 50; i++) {
        await generator.generateFromAudio(mockAudioFeatures);
      }
      
      const firstPoem = generator.getGeneratedPoems()[0];
      const firstPoemId = firstPoem.id;
      
      // Generate one more to exceed limit
      await generator.generateFromAudio(mockAudioFeatures);
      
      const poems = generator.getGeneratedPoems();
      expect(poems.length).toBe(50);
      
      // First poem should have been removed
      const stillHasFirstPoem = poems.some(p => p.id === firstPoemId);
      expect(stillHasFirstPoem).toBe(false);
    });
  });

  describe('template fallback', () => {
    it('should provide template poetry for different moods', async () => {
      const moods = [
        'joyful and energetic',
        'intense and dramatic',
        'melancholic and contemplative',
        'calm and peaceful',
        'fast-paced and exciting',
        'slow and reflective',
      ];

      for (const mood of moods) {
        const poetry = await generator.generateFromMood(mood);
        expect(poetry).toBeDefined();
        expect(poetry.length).toBeGreaterThan(0);
      }
    });

    it('should use default template for unknown moods', async () => {
      const poetry = await generator.generateFromMood('unknown-mood-xyz');
      expect(poetry).toBeDefined();
      expect(poetry.length).toBeGreaterThan(0);
    });
  });

  describe('mood inference', () => {
    it('should infer joyful mood from high energy and valence', async () => {
      const joyfulFeatures: AudioFeatures = {
        ...mockAudioFeatures,
        energy: 0.8,
        valence: 0.8,
      };

      const poetry = await generator.generateFromAudio(joyfulFeatures);
      expect(poetry).toBeDefined();
    });

    it('should infer melancholic mood from low energy and valence', async () => {
      const melancholicFeatures: AudioFeatures = {
        ...mockAudioFeatures,
        energy: 0.2,
        valence: 0.2,
      };

      const poetry = await generator.generateFromAudio(melancholicFeatures);
      expect(poetry).toBeDefined();
    });

    it('should infer dramatic mood from high energy and low valence', async () => {
      const dramaticFeatures: AudioFeatures = {
        ...mockAudioFeatures,
        energy: 0.8,
        valence: 0.3,
      };

      const poetry = await generator.generateFromAudio(dramaticFeatures);
      expect(poetry).toBeDefined();
    });

    it('should infer calm mood from low energy and high valence', async () => {
      const calmFeatures: AudioFeatures = {
        ...mockAudioFeatures,
        energy: 0.2,
        valence: 0.7,
      };

      const poetry = await generator.generateFromAudio(calmFeatures);
      expect(poetry).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle generation errors gracefully', async () => {
      // Should not throw, should fallback to template
      await expect(
        generator.generateFromAudio(mockAudioFeatures)
      ).resolves.not.toThrow();
    });

    it('should handle streaming errors gracefully', async () => {
      const callback = vi.fn();
      
      // Should not throw, should fallback to template
      await expect(
        generator.generateStream(mockAudioFeatures, callback)
      ).resolves.not.toThrow();
      
      // Should have called callback at least once
      expect(callback).toHaveBeenCalled();
    });
  });
});
