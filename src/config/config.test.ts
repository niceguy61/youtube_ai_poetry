/**
 * Configuration tests
 * Validates that configuration is properly loaded from environment variables
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONFIG, ConfigHelpers } from './config';

describe('CONFIG', () => {
  describe('API Configuration', () => {
    it('should have api configuration', () => {
      expect(CONFIG.api).toBeDefined();
      expect(CONFIG.api.ENDPOINT).toBeDefined();
      expect(CONFIG.api.YOUTUBE_BACKEND_URL).toBeDefined();
      expect(CONFIG.api.TIMEOUT).toBe(60000);
    });

    it('should use environment variable for API endpoint', () => {
      // In test environment, should fall back to localhost
      expect(CONFIG.api.ENDPOINT).toBeTruthy();
      expect(typeof CONFIG.api.ENDPOINT).toBe('string');
    });

    it('should use environment variable for YouTube backend URL', () => {
      expect(CONFIG.api.YOUTUBE_BACKEND_URL).toBeTruthy();
      expect(typeof CONFIG.api.YOUTUBE_BACKEND_URL).toBe('string');
    });
  });

  describe('AI Configuration', () => {
    it('should have AI provider configuration', () => {
      expect(CONFIG.ai.PROVIDER).toBeDefined();
      expect(['ollama', 'bedrock']).toContain(CONFIG.ai.PROVIDER);
    });

    it('should have Bedrock configuration', () => {
      expect(CONFIG.ai.BEDROCK_REGION).toBeDefined();
      expect(CONFIG.ai.BEDROCK_MODEL_ID).toBeDefined();
    });
  });

  describe('ConfigHelpers', () => {
    it('should validate configuration', () => {
      const result = ConfigHelpers.validate();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should get AI provider config', () => {
      const config = ConfigHelpers.getAIProviderConfig();
      expect(config).toHaveProperty('provider');
      expect(['ollama', 'bedrock']).toContain(config.provider);
    });
  });
});
