import { describe, it, expect } from 'vitest';
import { CONFIG, ENV, ConfigHelpers } from './config';

describe('Configuration', () => {
  describe('Audio Configuration', () => {
    it('should have correct audio max duration', () => {
      expect(CONFIG.audio.MAX_DURATION).toBe(300);
    });

    it('should have valid sample rate', () => {
      expect(CONFIG.audio.SAMPLE_RATE).toBe(44100);
    });

    it('should have valid FFT size', () => {
      expect(CONFIG.audio.FFT_SIZE).toBe(2048);
    });

    it('should have smoothing time constant between 0 and 1', () => {
      expect(CONFIG.audio.SMOOTHING_TIME_CONSTANT).toBeGreaterThanOrEqual(0);
      expect(CONFIG.audio.SMOOTHING_TIME_CONSTANT).toBeLessThanOrEqual(1);
    });
  });

  describe('Visualization Configuration', () => {
    it('should have positive visualization FPS target', () => {
      expect(CONFIG.visualization.TARGET_FPS).toBeGreaterThan(0);
    });

    it('should have valid default visualization mode', () => {
      expect(CONFIG.visualization.DEFAULT_MODE).toBe('gradient');
    });

    it('should have smoothing factor between 0 and 1', () => {
      expect(CONFIG.visualization.SMOOTHING).toBeGreaterThanOrEqual(0);
      expect(CONFIG.visualization.SMOOTHING).toBeLessThanOrEqual(1);
    });
  });

  describe('AI Provider Configuration', () => {
    it('should have valid AI provider', () => {
      expect(['ollama', 'bedrock']).toContain(CONFIG.ai.PROVIDER);
    });

    it('should have Ollama endpoint configured', () => {
      expect(CONFIG.ai.OLLAMA_ENDPOINT).toBeTruthy();
      expect(CONFIG.ai.OLLAMA_ENDPOINT).toContain('http');
    });

    it('should have Bedrock region configured', () => {
      expect(CONFIG.ai.BEDROCK_REGION).toBeTruthy();
    });

    it('should have generation timeout configured', () => {
      expect(CONFIG.ai.GENERATION_TIMEOUT).toBeGreaterThan(0);
    });

    it('should have temperature between 0 and 1', () => {
      expect(CONFIG.ai.TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(CONFIG.ai.TEMPERATURE).toBeLessThanOrEqual(1);
    });
  });

  describe('Environment Detection', () => {
    it('should have valid environment mode', () => {
      expect(['development', 'production', 'test']).toContain(ENV.MODE);
    });

    it('should have boolean dev flag', () => {
      expect(typeof ENV.IS_DEV).toBe('boolean');
    });

    it('should have boolean prod flag', () => {
      expect(typeof ENV.IS_PROD).toBe('boolean');
    });

    it('should have valid log level', () => {
      expect(['debug', 'info', 'warn', 'error']).toContain(ENV.LOG_LEVEL);
    });

    it('should not be both dev and prod', () => {
      expect(ENV.IS_DEV && ENV.IS_PROD).toBe(false);
    });
  });

  describe('ConfigHelpers', () => {
    it('should correctly identify development mode', () => {
      const isDev = ConfigHelpers.isDevelopment();
      expect(typeof isDev).toBe('boolean');
      expect(isDev).toBe(ENV.IS_DEV);
    });

    it('should correctly identify production mode', () => {
      const isProd = ConfigHelpers.isProduction();
      expect(typeof isProd).toBe('boolean');
      expect(isProd).toBe(ENV.IS_PROD);
    });

    it('should return current environment', () => {
      const env = ConfigHelpers.getEnvironment();
      expect(['development', 'production', 'test']).toContain(env);
    });

    it('should validate log levels correctly', () => {
      // Error level should always be shown
      expect(ConfigHelpers.shouldLog('error')).toBe(true);
      
      // Debug should only show in debug mode
      if (ENV.LOG_LEVEL === 'error') {
        expect(ConfigHelpers.shouldLog('debug')).toBe(false);
      }
    });

    it('should return AI provider config', () => {
      const providerConfig = ConfigHelpers.getAIProviderConfig();
      expect(providerConfig.provider).toBe(CONFIG.ai.PROVIDER);
      
      if (providerConfig.provider === 'ollama') {
        expect(providerConfig.endpoint).toBe(CONFIG.ai.OLLAMA_ENDPOINT);
        expect(providerConfig.model).toBe(CONFIG.ai.OLLAMA_MODEL);
      } else {
        expect(providerConfig.region).toBe(CONFIG.ai.BEDROCK_REGION);
        expect(providerConfig.modelId).toBe(CONFIG.ai.BEDROCK_MODEL_ID);
      }
    });

    it('should validate configuration', () => {
      const validation = ConfigHelpers.validate();
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
      
      // With default config, validation should pass
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Poetry Configuration', () => {
    it('should have minimum interval configured', () => {
      expect(CONFIG.poetry.MIN_INTERVAL).toBeGreaterThanOrEqual(0);
    });

    it('should have max poems stored configured', () => {
      expect(CONFIG.poetry.MAX_POEMS_STORED).toBeGreaterThan(0);
    });
  });

  describe('Canvas Configuration', () => {
    it('should have default dimensions configured', () => {
      expect(CONFIG.canvas.DEFAULT_WIDTH).toBeGreaterThan(0);
      expect(CONFIG.canvas.DEFAULT_HEIGHT).toBeGreaterThan(0);
    });
  });

  describe('Export Configuration', () => {
    it('should have valid image format', () => {
      expect(CONFIG.export.IMAGE_FORMAT).toBe('png');
    });

    it('should have image quality between 0 and 1', () => {
      expect(CONFIG.export.IMAGE_QUALITY).toBeGreaterThanOrEqual(0);
      expect(CONFIG.export.IMAGE_QUALITY).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling Configuration', () => {
    it('should have max retries configured', () => {
      expect(CONFIG.error.MAX_RETRIES).toBeGreaterThan(0);
    });

    it('should have retry delay configured', () => {
      expect(CONFIG.error.RETRY_DELAY).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Configuration', () => {
    it('should have cache size configured', () => {
      expect(CONFIG.performance.MAX_CACHE_SIZE).toBeGreaterThan(0);
    });
  });
});
