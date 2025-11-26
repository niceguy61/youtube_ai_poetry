import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isValidDuration, isValidURL, isValidAudioFile } from './validation';

describe('Validation Utilities', () => {
  describe('isValidDuration', () => {
    it('should accept durations within limit', () => {
      expect(isValidDuration(100)).toBe(true);
      expect(isValidDuration(300)).toBe(true);
    });

    it('should reject durations over limit', () => {
      expect(isValidDuration(301)).toBe(false);
      expect(isValidDuration(500)).toBe(false);
    });

    it('should reject zero and negative durations', () => {
      expect(isValidDuration(0)).toBe(false);
      expect(isValidDuration(-10)).toBe(false);
    });

    // Property-based test example
    it('property: should correctly validate all duration boundaries', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -100, max: 1000 }),
          (duration) => {
            const result = isValidDuration(duration);
            
            // Property: duration must be positive and <= 300
            if (duration > 0 && duration <= 300) {
              expect(result).toBe(true);
            } else {
              expect(result).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidURL', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('https://example.com/audio.mp3')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('ftp://example.com')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('isValidAudioFile', () => {
    it('should accept valid audio file extensions', () => {
      expect(isValidAudioFile('song.mp3')).toBe(true);
      expect(isValidAudioFile('audio.ogg')).toBe(true);
      expect(isValidAudioFile('MUSIC.MP3')).toBe(true);
    });

    it('should reject invalid file extensions', () => {
      expect(isValidAudioFile('video.mp4')).toBe(false);
      expect(isValidAudioFile('document.pdf')).toBe(false);
      expect(isValidAudioFile('noextension')).toBe(false);
    });
  });
});
