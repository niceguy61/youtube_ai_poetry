/**
 * Tests for ExportManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportManager } from './ExportManager';
import type { ExperienceData } from '../types/export';

describe('ExportManager', () => {
  let exportManager: ExportManager;
  let mockCanvas: HTMLCanvasElement;
  let sampleExperience: ExperienceData;

  beforeEach(() => {
    exportManager = new ExportManager();
    
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    const ctx = mockCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 800, 600);
    }

    // Sample experience data
    sampleExperience = {
      audioSource: {
        type: 'file',
        reference: 'test-audio.mp3'
      },
      poems: [
        'Roses are red\nViolets are blue',
        'The music flows\nThrough me and you'
      ],
      canvasState: [
        {
          id: 'elem1',
          type: 'text',
          position: { x: 100, y: 100 },
          properties: { text: 'Hello' },
          interactive: true
        }
      ],
      visualizationConfig: {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF'
        },
        sensitivity: 0.8,
        smoothing: 0.5,
        layers: ['background-gradient']
      },
      timestamp: Date.now()
    };
  });

  describe('exportPoetry', () => {
    it('should export poetry as plain text', async () => {
      const poems = ['First poem', 'Second poem'];
      const blob = await exportManager.exportPoetry(poems, 'txt');

      expect(blob.type).toBe('text/plain');
      
      // Read blob using FileReader for jsdom compatibility
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      
      expect(text).toContain('Poem 1:');
      expect(text).toContain('First poem');
      expect(text).toContain('Poem 2:');
      expect(text).toContain('Second poem');
      expect(text).toContain('---');
    });

    it('should export poetry as JSON', async () => {
      const poems = ['First poem', 'Second poem'];
      const blob = await exportManager.exportPoetry(poems, 'json');

      expect(blob.type).toBe('application/json');
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      
      const data = JSON.parse(text);
      
      expect(data.poems).toEqual(poems);
      expect(data.count).toBe(2);
      expect(data.exportedAt).toBeDefined();
    });

    it('should export poetry as Markdown', async () => {
      const poems = ['First poem', 'Second poem'];
      const blob = await exportManager.exportPoetry(poems, 'markdown');

      expect(blob.type).toBe('text/markdown');
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      
      expect(text).toContain('# Poetry Collection');
      expect(text).toContain('## Poem 1');
      expect(text).toContain('First poem');
      expect(text).toContain('## Poem 2');
      expect(text).toContain('Second poem');
    });

    it('should handle empty poetry array', async () => {
      const blob = await exportManager.exportPoetry([], 'txt');
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      
      expect(text).toContain('No poetry generated');
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        exportManager.exportPoetry(['poem'], 'xml' as any)
      ).rejects.toThrow('Unsupported format');
    });
  });

  describe('exportCanvas', () => {
    it('should export canvas as PNG', async () => {
      // Mock toBlob for jsdom
      const mockBlob = new Blob(['mock image data'], { type: 'image/png' });
      vi.spyOn(mockCanvas, 'toBlob').mockImplementation((callback) => {
        callback(mockBlob);
      });

      const blob = await exportManager.exportCanvas(mockCanvas, 'png');
      
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should export canvas as JPG', async () => {
      // Mock toBlob for jsdom
      const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });
      vi.spyOn(mockCanvas, 'toBlob').mockImplementation((callback) => {
        callback(mockBlob);
      });

      const blob = await exportManager.exportCanvas(mockCanvas, 'jpg');
      
      expect(blob.type).toBe('image/jpeg');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle canvas export failure', async () => {
      // Create a mock canvas that fails to convert
      const failingCanvas = {
        toBlob: (callback: BlobCallback) => {
          callback(null);
        }
      } as unknown as HTMLCanvasElement;

      await expect(
        exportManager.exportCanvas(failingCanvas, 'png')
      ).rejects.toThrow('Failed to convert canvas to blob');
    });
  });

  describe('exportExperience', () => {
    it('should export complete experience data', async () => {
      const exported = await exportManager.exportExperience(sampleExperience);

      expect(exported).toEqual(sampleExperience);
      expect(exported).not.toBe(sampleExperience); // Should be a copy
    });

    it('should validate experience data', async () => {
      const invalidExperience = { ...sampleExperience, audioSource: null as any };

      await expect(
        exportManager.exportExperience(invalidExperience)
      ).rejects.toThrow('Audio source is required');
    });
  });

  describe('generateShareURL', () => {
    it('should generate a valid share URL', async () => {
      const url = await exportManager.generateShareURL(sampleExperience);

      expect(url).toContain('?share=');
      expect(url).toMatch(/^https?:\/\//);
    });

    it('should encode experience data in URL', async () => {
      const url = await exportManager.generateShareURL(sampleExperience);
      const urlObj = new URL(url);
      const shareParam = urlObj.searchParams.get('share');

      expect(shareParam).toBeDefined();
      expect(shareParam).not.toContain('+'); // URL-safe encoding
      expect(shareParam).not.toContain('/'); // URL-safe encoding
    });

    it('should validate experience before generating URL', async () => {
      const invalidExperience = { ...sampleExperience, timestamp: 'invalid' as any };

      await expect(
        exportManager.generateShareURL(invalidExperience)
      ).rejects.toThrow('Timestamp must be a number');
    });
  });

  describe('loadFromShareURL', () => {
    it('should load experience from share URL', async () => {
      // First generate a share URL
      const shareUrl = await exportManager.generateShareURL(sampleExperience);

      // Then load from it
      const loaded = await exportManager.loadFromShareURL(shareUrl);

      expect(loaded).toEqual(sampleExperience);
    });

    it('should handle URL without share parameter', async () => {
      const url = 'http://example.com/';

      await expect(
        exportManager.loadFromShareURL(url)
      ).rejects.toThrow('No share data found in URL');
    });

    it('should handle invalid encoded data', async () => {
      const url = 'http://example.com/?share=invalid!!!data';

      await expect(
        exportManager.loadFromShareURL(url)
      ).rejects.toThrow('Failed to load experience from URL');
    });

    it('should validate loaded experience data', async () => {
      // Create URL with invalid data
      const invalidData = { invalid: 'data' };
      const encoded = btoa(JSON.stringify(invalidData));
      const url = `http://example.com/?share=${encoded}`;

      await expect(
        exportManager.loadFromShareURL(url)
      ).rejects.toThrow();
    });
  });

  describe('round-trip sharing', () => {
    it('should preserve experience through share URL round-trip', async () => {
      // Generate share URL
      const shareUrl = await exportManager.generateShareURL(sampleExperience);

      // Load from share URL
      const loaded = await exportManager.loadFromShareURL(shareUrl);

      // Should match original
      expect(loaded).toEqual(sampleExperience);
    });

    it('should handle different audio source types', async () => {
      const experiences: ExperienceData[] = [
        { ...sampleExperience, audioSource: { type: 'file', reference: 'audio.mp3' } },
        { ...sampleExperience, audioSource: { type: 'url', reference: 'http://example.com/audio.mp3' } },
        { ...sampleExperience, audioSource: { type: 'youtube', reference: 'https://youtube.com/watch?v=abc' } }
      ];

      for (const experience of experiences) {
        const shareUrl = await exportManager.generateShareURL(experience);
        const loaded = await exportManager.loadFromShareURL(shareUrl);
        expect(loaded.audioSource).toEqual(experience.audioSource);
      }
    });
  });

  describe('validation', () => {
    it('should reject experience without audio source', async () => {
      const invalid = { ...sampleExperience, audioSource: undefined as any };

      await expect(
        exportManager.exportExperience(invalid)
      ).rejects.toThrow('Audio source is required');
    });

    it('should reject invalid audio source type', async () => {
      const invalid = {
        ...sampleExperience,
        audioSource: { type: 'invalid' as any, reference: 'test' }
      };

      await expect(
        exportManager.exportExperience(invalid)
      ).rejects.toThrow('Invalid audio source type');
    });

    it('should reject experience without audio reference', async () => {
      const invalid = {
        ...sampleExperience,
        audioSource: { type: 'file', reference: '' }
      };

      await expect(
        exportManager.exportExperience(invalid)
      ).rejects.toThrow('Audio source reference is required');
    });

    it('should reject experience with non-array poems', async () => {
      const invalid = { ...sampleExperience, poems: 'not an array' as any };

      await expect(
        exportManager.exportExperience(invalid)
      ).rejects.toThrow('Poems must be an array');
    });

    it('should reject experience with non-array canvas state', async () => {
      const invalid = { ...sampleExperience, canvasState: 'not an array' as any };

      await expect(
        exportManager.exportExperience(invalid)
      ).rejects.toThrow('Canvas state must be an array');
    });

    it('should reject experience without visualization config', async () => {
      const invalid = { ...sampleExperience, visualizationConfig: undefined as any };

      await expect(
        exportManager.exportExperience(invalid)
      ).rejects.toThrow('Visualization config is required');
    });
  });

  describe('poetry formatting', () => {
    it('should preserve line breaks in text format', async () => {
      const poems = ['Line 1\nLine 2\nLine 3'];
      const blob = await exportManager.exportPoetry(poems, 'txt');
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });

      expect(text).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should preserve line breaks in markdown format', async () => {
      const poems = ['Line 1\nLine 2\nLine 3'];
      const blob = await exportManager.exportPoetry(poems, 'markdown');
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });

      expect(text).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should handle special characters in JSON', async () => {
      const poems = ['Poem with "quotes" and \'apostrophes\''];
      const blob = await exportManager.exportPoetry(poems, 'json');
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      
      const data = JSON.parse(text);

      expect(data.poems[0]).toBe(poems[0]);
    });
  });
});
