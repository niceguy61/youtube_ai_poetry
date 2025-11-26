/**
 * Unit tests for YouTubeExtractor service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YouTubeExtractor, YouTubeExtractorError } from './YouTubeExtractor';

describe('YouTubeExtractor', () => {
  let extractor: YouTubeExtractor;

  beforeEach(() => {
    extractor = new YouTubeExtractor('http://localhost:3000/api/youtube/extract');
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('isValidYouTubeURL', () => {
    it('should validate standard YouTube watch URLs', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
      ];

      validUrls.forEach(url => {
        expect(extractor.isValidYouTubeURL(url)).toBe(true);
      });
    });

    it('should validate YouTube short URLs', () => {
      const validUrls = [
        'https://youtu.be/dQw4w9WgXcQ',
        'http://youtu.be/dQw4w9WgXcQ',
      ];

      validUrls.forEach(url => {
        expect(extractor.isValidYouTubeURL(url)).toBe(true);
      });
    });

    it('should validate mobile YouTube URLs', () => {
      const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractor.isValidYouTubeURL(url)).toBe(true);
    });

    it('should validate YouTube embed URLs', () => {
      const validUrls = [
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://youtube.com/embed/dQw4w9WgXcQ',
      ];

      validUrls.forEach(url => {
        expect(extractor.isValidYouTubeURL(url)).toBe(true);
      });
    });

    it('should validate URLs with query parameters', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=zMyHqip2wfo&list=RDGMEMTmC-2iNKH_l8gQ1LHo9FeQ&start_radio=1',
        'https://www.youtube.com/watch?v=av9ckvRxnNs&list=RDATgy&start_radio=1',
        'https://youtu.be/dQw4w9WgXcQ?t=42',
      ];

      validUrls.forEach(url => {
        expect(extractor.isValidYouTubeURL(url)).toBe(true);
      });
    });

    it('should reject invalid YouTube URLs', () => {
      const invalidUrls = [
        'https://vimeo.com/123456',
        'https://www.youtube.com/channel/UCxxxxxx',
        'https://www.youtube.com/user/username',
        'not a url at all',
        'https://example.com',
        '',
        'ftp://youtube.com/watch?v=123',
      ];

      invalidUrls.forEach(url => {
        expect(extractor.isValidYouTubeURL(url)).toBe(false);
      });
    });

    it('should reject null and undefined inputs', () => {
      expect(extractor.isValidYouTubeURL(null as any)).toBe(false);
      expect(extractor.isValidYouTubeURL(undefined as any)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(extractor.isValidYouTubeURL(123 as any)).toBe(false);
      expect(extractor.isValidYouTubeURL({} as any)).toBe(false);
      expect(extractor.isValidYouTubeURL([] as any)).toBe(false);
    });
  });

  describe('extractAudio', () => {
    it('should throw error for invalid URL', async () => {
      await expect(
        extractor.extractAudio('https://vimeo.com/123456')
      ).rejects.toThrow(YouTubeExtractorError);

      await expect(
        extractor.extractAudio('https://vimeo.com/123456')
      ).rejects.toThrow('Invalid YouTube URL');
    });

    it('should throw error with INVALID_URL code for invalid URL', async () => {
      try {
        await extractor.extractAudio('not a url');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeExtractorError);
        expect((error as YouTubeExtractorError).code).toBe('INVALID_URL');
      }
    });

    it('should call extraction endpoint with correct parameters', async () => {
      // Create a mock AudioBuffer object
      const mockAudioBuffer = {
        length: 44100,
        numberOfChannels: 2,
        sampleRate: 44100,
        duration: 1,
        getChannelData: vi.fn(),
        copyFromChannel: vi.fn(),
        copyToChannel: vi.fn(),
      };

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      // Mock AudioContext constructor
      (global as any).AudioContext = class {
        decodeAudioData = vi.fn().mockResolvedValue(mockAudioBuffer);
      };

      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      await extractor.extractAudio(url);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/youtube/extract',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('dQw4w9WgXcQ'),
        })
      );
    });

    it('should handle extraction service errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(
        extractor.extractAudio('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).rejects.toThrow('Server error');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      try {
        await extractor.extractAudio('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeExtractorError);
        expect((error as YouTubeExtractorError).code).toBe('NETWORK_ERROR');
      }
    });

    it('should return AudioBuffer on successful extraction', async () => {
      // Create a mock AudioBuffer object
      const mockAudioBuffer = {
        length: 44100,
        numberOfChannels: 2,
        sampleRate: 44100,
        duration: 1,
        getChannelData: vi.fn(),
        copyFromChannel: vi.fn(),
        copyToChannel: vi.fn(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      // Mock AudioContext constructor
      (global as any).AudioContext = class {
        decodeAudioData = vi.fn().mockResolvedValue(mockAudioBuffer);
      };

      const result = await extractor.extractAudio('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      expect(result).toBeDefined();
      expect(result.length).toBe(44100);
      expect(result.numberOfChannels).toBe(2);
      expect(result.sampleRate).toBe(44100);
    });
  });

  describe('getVideoInfo', () => {
    it('should throw error for invalid URL', async () => {
      await expect(
        extractor.getVideoInfo('https://vimeo.com/123456')
      ).rejects.toThrow(YouTubeExtractorError);

      await expect(
        extractor.getVideoInfo('https://vimeo.com/123456')
      ).rejects.toThrow('Invalid YouTube URL');
    });

    it('should throw error with INVALID_URL code for invalid URL', async () => {
      try {
        await extractor.getVideoInfo('not a url');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeExtractorError);
        expect((error as YouTubeExtractorError).code).toBe('INVALID_URL');
      }
    });

    it('should call metadata endpoint with correct parameters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Test Video',
          duration: 180,
          thumbnail: 'https://example.com/thumb.jpg',
          author: 'Test Author',
        }),
      });

      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      await extractor.getVideoInfo(url);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/youtube/extract/info',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('dQw4w9WgXcQ'),
        })
      );
    });

    it('should return video metadata on success', async () => {
      const mockVideoInfo = {
        title: 'Test Video',
        duration: 180,
        thumbnail: 'https://example.com/thumb.jpg',
        author: 'Test Author',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockVideoInfo,
      });

      const result = await extractor.getVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      expect(result).toEqual(mockVideoInfo);
      expect(result.title).toBe('Test Video');
      expect(result.duration).toBe(180);
    });

    it('should handle metadata service errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Video not found' }),
      });

      await expect(
        extractor.getVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).rejects.toThrow('Video not found');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      try {
        await extractor.getVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeExtractorError);
        expect((error as YouTubeExtractorError).code).toBe('NETWORK_ERROR');
      }
    });

    it('should validate metadata response structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          // Missing required fields
          thumbnail: 'https://example.com/thumb.jpg',
        }),
      });

      try {
        await extractor.getVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeExtractorError);
        expect((error as YouTubeExtractorError).code).toBe('METADATA_ERROR');
      }
    });
  });

  describe('Error handling', () => {
    it('should create YouTubeExtractorError with correct properties', () => {
      const error = new YouTubeExtractorError('Test error', 'INVALID_URL');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(YouTubeExtractorError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INVALID_URL');
      expect(error.name).toBe('YouTubeExtractorError');
    });

    it('should support all error codes', () => {
      const codes: Array<'INVALID_URL' | 'EXTRACTION_FAILED' | 'NETWORK_ERROR' | 'METADATA_ERROR'> = [
        'INVALID_URL',
        'EXTRACTION_FAILED',
        'NETWORK_ERROR',
        'METADATA_ERROR',
      ];

      codes.forEach(code => {
        const error = new YouTubeExtractorError('Test', code);
        expect(error.code).toBe(code);
      });
    });
  });
});
