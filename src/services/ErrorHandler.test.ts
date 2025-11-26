import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler, ErrorCategory, ErrorContext, UserNotification } from './ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  describe('classifyError', () => {
    it('should classify audio loading errors', () => {
      const errors = [
        new Error('Invalid file format'),
        new Error('Corrupted audio data'),
        new Error('Duration exceeds limit'),
        new Error('Audio file not found'),
      ];

      errors.forEach((error) => {
        expect(errorHandler.classifyError(error)).toBe('AUDIO_LOADING');
      });
    });

    it('should classify audio processing errors', () => {
      const errors = [
        new Error('Audio context creation failed'),
        new Error('Web Audio API not supported'),
        new Error('Decoding error occurred'),
      ];

      errors.forEach((error) => {
        expect(errorHandler.classifyError(error)).toBe('AUDIO_PROCESSING');
      });
    });

    it('should classify AI service errors', () => {
      const errors = [
        new Error('Ollama service unavailable'),
        new Error('Bedrock authentication failed'),
        new Error('AI provider error'),
        new Error('Poetry generation failed'),
        new Error('Rate limit exceeded'),
        new Error('Insufficient GPU resources'),
      ];

      errors.forEach((error) => {
        expect(errorHandler.classifyError(error)).toBe('AI_SERVICE');
      });
    });

    it('should classify visualization errors', () => {
      const errors = [
        new Error('Canvas context creation failed'),
        new Error('WebGL not supported'),
        new Error('Visualization rendering error'),
        new Error('Animation frame request failed'),
      ];

      errors.forEach((error) => {
        expect(errorHandler.classifyError(error)).toBe('VISUALIZATION');
      });
    });

    it('should classify export errors', () => {
      const errors = [
        new Error('Export failed'),
        new Error('Blob conversion error'),
        new Error('File system access denied'),
        new Error('Share URL generation failed'),
      ];

      errors.forEach((error) => {
        expect(errorHandler.classifyError(error)).toBe('EXPORT');
      });
    });

    it('should classify network errors', () => {
      const errors = [
        new Error('Network timeout'),
        new Error('Fetch failed'),
        new Error('CORS error'),
        new Error('Connection refused'),
      ];

      errors.forEach((error) => {
        expect(errorHandler.classifyError(error)).toBe('NETWORK');
      });
    });

    it('should classify validation errors', () => {
      const errors = [
        new Error('Validation failed'),
        new Error('Invalid input'),
        new Error('Required field missing'),
      ];

      errors.forEach((error) => {
        expect(errorHandler.classifyError(error)).toBe('VALIDATION');
      });
    });

    it('should classify unknown errors', () => {
      const error = new Error('Something completely unexpected');
      expect(errorHandler.classifyError(error)).toBe('UNKNOWN');
    });
  });

  describe('attemptRecovery', () => {
    const context: ErrorContext = {
      component: 'TestComponent',
      operation: 'testOperation',
      timestamp: Date.now(),
    };

    it('should not recover from audio loading errors', async () => {
      const error = new Error('Duration exceeds limit');
      const result = await errorHandler.attemptRecovery(error, context);

      expect(result.recovered).toBe(false);
      expect(result.message).toContain('5 minutes');
    });

    it('should not recover from audio processing errors', async () => {
      const error = new Error('Audio context not supported');
      const result = await errorHandler.attemptRecovery(error, context);

      expect(result.recovered).toBe(false);
      expect(result.message).toContain('browser');
    });

    it('should recover from AI service errors with fallback', async () => {
      const error = new Error('Ollama service unavailable');
      const result = await errorHandler.attemptRecovery(error, context);

      expect(result.recovered).toBe(true);
      expect(result.fallbackAction).toBeDefined();
      expect(result.message).toContain('template');
    });

    it('should recover from WebGL visualization errors', async () => {
      const error = new Error('WebGL not supported');
      const result = await errorHandler.attemptRecovery(error, context);

      expect(result.recovered).toBe(true);
      expect(result.fallbackAction).toBeDefined();
      expect(result.message).toContain('Canvas 2D');
    });

    it('should not recover from export errors', async () => {
      const error = new Error('Export failed');
      const result = await errorHandler.attemptRecovery(error, context);

      expect(result.recovered).toBe(false);
      expect(result.message).toContain('try again');
    });

    it('should not recover from network errors', async () => {
      const error = new Error('Network timeout');
      const result = await errorHandler.attemptRecovery(error, context);

      expect(result.recovered).toBe(false);
      expect(result.message).toContain('connection');
    });
  });

  describe('notifyUser', () => {
    it('should call notification callback when set', () => {
      const callback = vi.fn();
      errorHandler.setNotificationCallback(callback);

      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: Date.now(),
      };

      errorHandler.notifyUser(error, context);

      expect(callback).toHaveBeenCalledOnce();
      const notification: UserNotification = callback.mock.calls[0][0];
      expect(notification.type).toBe('error');
      expect(notification.title).toBeDefined();
      expect(notification.message).toBeDefined();
    });

    it('should create appropriate notification for audio loading errors', () => {
      const callback = vi.fn();
      errorHandler.setNotificationCallback(callback);

      const error = new Error('Invalid file format');
      const context: ErrorContext = {
        component: 'AudioManager',
        operation: 'loadFile',
        timestamp: Date.now(),
      };

      errorHandler.notifyUser(error, context);

      const notification: UserNotification = callback.mock.calls[0][0];
      expect(notification.title).toBe('Audio Loading Error');
      expect(notification.message).toContain('MP3 or OGG');
      expect(notification.suggestedAction).toContain('different audio file');
    });

    it('should create warning notification for AI service errors', () => {
      const callback = vi.fn();
      errorHandler.setNotificationCallback(callback);

      const error = new Error('AI provider unavailable');
      const context: ErrorContext = {
        component: 'PoetryGenerator',
        operation: 'generate',
        timestamp: Date.now(),
      };

      errorHandler.notifyUser(error, context);

      const notification: UserNotification = callback.mock.calls[0][0];
      expect(notification.type).toBe('warning');
      expect(notification.message).toContain('template');
    });
  });

  describe('logError', () => {
    it('should add error to log', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: Date.now(),
      };

      errorHandler.logError(error, context);

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].error).toBe(error);
      expect(log[0].context.component).toBe('TestComponent');
    });

    it('should limit log to 100 entries', () => {
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: Date.now(),
      };

      // Add 150 errors
      for (let i = 0; i < 150; i++) {
        errorHandler.logError(new Error(`Error ${i}`), context);
      }

      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(100);
      // Should keep the most recent errors
      expect(log[log.length - 1].error.message).toBe('Error 149');
    });

    it('should clear error log', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation',
        timestamp: Date.now(),
      };

      errorHandler.logError(error, context);
      expect(errorHandler.getErrorLog()).toHaveLength(1);

      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });
  });

  describe('retryNetworkOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.retryNetworkOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should retry network errors up to 3 times', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const result = await errorHandler.retryNetworkOperation(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network timeout'));

      await expect(
        errorHandler.retryNetworkOperation(operation, {
          maxAttempts: 3,
          delayMs: 10,
        })
      ).rejects.toThrow('Network timeout');

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-network errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Invalid file format'));

      await expect(
        errorHandler.retryNetworkOperation(operation, {
          maxAttempts: 3,
          delayMs: 10,
        })
      ).rejects.toThrow('Invalid file format');

      expect(operation).toHaveBeenCalledOnce();
    });

    it('should use exponential backoff when enabled', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await errorHandler.retryNetworkOperation(operation, {
        maxAttempts: 3,
        delayMs: 100,
        backoff: true,
      });
      const endTime = Date.now();

      // With backoff: 100ms + 200ms = 300ms minimum
      // Without backoff: 100ms + 100ms = 200ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
    });

    it('should use constant delay when backoff disabled', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await errorHandler.retryNetworkOperation(operation, {
        maxAttempts: 3,
        delayMs: 50,
        backoff: false,
      });
      const endTime = Date.now();

      // With constant delay: 50ms + 50ms = 100ms minimum
      expect(endTime - startTime).toBeGreaterThanOrEqual(80);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should use default options', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const result = await errorHandler.retryNetworkOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
