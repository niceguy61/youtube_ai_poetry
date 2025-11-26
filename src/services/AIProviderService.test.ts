/**
 * Tests for AI Provider Service abstraction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaProvider } from './OllamaProvider';
import { BedrockProvider } from './BedrockProvider';
import { createAIProvider, getDefaultGenerationOptions } from './AIProviderFactory';
import type { ProviderConfig, GenerationOptions } from '../types/poetry';

describe('OllamaProvider', () => {
  let provider: OllamaProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      ollama: {
        endpoint: 'http://localhost:11434',
        model: 'gemma3:4b',
      },
    };
    provider = new OllamaProvider(config);
  });

  describe('constructor', () => {
    it('should initialize with ollama configuration', () => {
      expect(provider.getCurrentProvider()).toBe('ollama');
    });

    it('should throw error if ollama config is missing', () => {
      expect(() => new OllamaProvider({})).toThrow('Ollama configuration is required');
    });
  });

  describe('setProvider', () => {
    it('should update configuration', async () => {
      const newConfig: ProviderConfig = {
        ollama: {
          endpoint: 'http://localhost:11435',
          model: 'mistral',
        },
      };

      // Mock the isAvailable check
      vi.spyOn(provider, 'isAvailable').mockResolvedValue(true);

      await provider.setProvider('ollama', newConfig);
      expect(provider.getCurrentProvider()).toBe('ollama');
    });

    it('should throw error if provider is not ollama', async () => {
      await expect(
        provider.setProvider('bedrock', config)
      ).rejects.toThrow('OllamaProvider can only be set to ollama provider');
    });

    it('should throw error if ollama config is missing', async () => {
      await expect(
        provider.setProvider('ollama', {})
      ).rejects.toThrow('Ollama configuration is required');
    });
  });

  describe('generate', () => {
    it('should generate text from prompt', async () => {
      const mockResponse = {
        model: 'gemma3:4b',
        created_at: '2024-01-01T00:00:00Z',
        response: 'Generated poetry text',
        done: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const options: GenerationOptions = {
        temperature: 0.7,
        maxTokens: 100,
      };

      const result = await provider.generate('Test prompt', options);
      expect(result).toBe('Generated poetry text');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const options: GenerationOptions = {
        temperature: 0.7,
        maxTokens: 100,
      };

      await expect(
        provider.generate('Test prompt', options)
      ).rejects.toThrow('Failed to generate text with Ollama');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const options: GenerationOptions = {
        temperature: 0.7,
        maxTokens: 100,
      };

      await expect(
        provider.generate('Test prompt', options)
      ).rejects.toThrow('Failed to generate text with Ollama');
    });
  });

  describe('isAvailable', () => {
    it('should return true when service is available', async () => {
      const mockResponse = {
        models: [
          { name: 'gemma3:4b', modified_at: '2024-01-01', size: 1000, digest: 'abc' },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when model is not available', async () => {
      const mockResponse = {
        models: [
          { name: 'mistral', modified_at: '2024-01-01', size: 1000, digest: 'abc' },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('checkResources', () => {
    it('should return available status when service is ready', async () => {
      vi.spyOn(provider, 'isAvailable').mockResolvedValue(true);

      const result = await provider.checkResources();
      expect(result.available).toBe(true);
      expect(result.message).toContain('available and ready');
    });

    it('should return unavailable status when service is not ready', async () => {
      vi.spyOn(provider, 'isAvailable').mockResolvedValue(false);

      const result = await provider.checkResources();
      expect(result.available).toBe(false);
      expect(result.message).toContain('not available');
    });
  });
});

describe('BedrockProvider', () => {
  let provider: BedrockProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      bedrock: {
        region: 'us-east-1',
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
        },
      },
    };
    provider = new BedrockProvider(config);
  });

  describe('constructor', () => {
    it('should initialize with bedrock configuration', () => {
      expect(provider.getCurrentProvider()).toBe('bedrock');
    });

    it('should throw error if bedrock config is missing', () => {
      expect(() => new BedrockProvider({})).toThrow('Bedrock configuration is required');
    });
  });

  describe('setProvider', () => {
    it('should update configuration', async () => {
      const newConfig: ProviderConfig = {
        bedrock: {
          region: 'us-west-2',
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          credentials: {
            accessKeyId: 'new-key',
            secretAccessKey: 'new-secret',
          },
        },
      };

      vi.spyOn(provider, 'isAvailable').mockResolvedValue(true);

      await provider.setProvider('bedrock', newConfig);
      expect(provider.getCurrentProvider()).toBe('bedrock');
    });

    it('should throw error if provider is not bedrock', async () => {
      await expect(
        provider.setProvider('ollama', config)
      ).rejects.toThrow('BedrockProvider can only be set to bedrock provider');
    });
  });

  describe('generate', () => {
    it('should throw error indicating AWS SDK is needed', async () => {
      const options: GenerationOptions = {
        temperature: 0.7,
        maxTokens: 100,
      };

      await expect(
        provider.generate('Test prompt', options)
      ).rejects.toThrow('AWS SDK');
    });
  });

  describe('isAvailable', () => {
    it('should return true when credentials are provided', async () => {
      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when credentials are missing', async () => {
      const configWithoutCreds: ProviderConfig = {
        bedrock: {
          region: 'us-east-1',
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        },
      };
      const providerWithoutCreds = new BedrockProvider(configWithoutCreds);

      const result = await providerWithoutCreds.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('checkResources', () => {
    it('should return available status when credentials are valid', async () => {
      const result = await provider.checkResources();
      expect(result.available).toBe(true);
      expect(result.message).toContain('available and ready');
    });

    it('should return unavailable status when credentials are missing', async () => {
      const configWithoutCreds: ProviderConfig = {
        bedrock: {
          region: 'us-east-1',
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        },
      };
      const providerWithoutCreds = new BedrockProvider(configWithoutCreds);

      const result = await providerWithoutCreds.checkResources();
      expect(result.available).toBe(false);
      expect(result.message).toContain('not available');
    });
  });
});

describe('AIProviderFactory', () => {
  describe('createAIProvider', () => {
    it('should create OllamaProvider when provider is ollama', () => {
      const provider = createAIProvider('ollama');
      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.getCurrentProvider()).toBe('ollama');
    });

    it('should create BedrockProvider when provider is bedrock', () => {
      const provider = createAIProvider('bedrock');
      expect(provider).toBeInstanceOf(BedrockProvider);
      expect(provider.getCurrentProvider()).toBe('bedrock');
    });

    it('should use custom configuration when provided', () => {
      const customConfig: ProviderConfig = {
        ollama: {
          endpoint: 'http://custom:11434',
          model: 'custom-model',
        },
      };

      const provider = createAIProvider('ollama', customConfig);
      expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should throw error for unknown provider', () => {
      expect(() => createAIProvider('unknown' as any)).toThrow('Unknown AI provider');
    });
  });

  describe('getDefaultGenerationOptions', () => {
    it('should return default generation options', () => {
      const options = getDefaultGenerationOptions();
      expect(options).toHaveProperty('temperature');
      expect(options).toHaveProperty('maxTokens');
      expect(options).toHaveProperty('topP');
      expect(options).toHaveProperty('stopSequences');
    });

    it('should have reasonable default values', () => {
      const options = getDefaultGenerationOptions();
      expect(options.temperature).toBeGreaterThan(0);
      expect(options.temperature).toBeLessThanOrEqual(1);
      expect(options.maxTokens).toBeGreaterThan(0);
      expect(options.topP).toBeGreaterThan(0);
      expect(options.topP).toBeLessThanOrEqual(1);
    });
  });
});
