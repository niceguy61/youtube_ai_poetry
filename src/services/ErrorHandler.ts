/**
 * ErrorHandler - Centralized error handling service
 * 
 * Provides error classification, recovery strategies, user notifications,
 * and logging for the Music Poetry Canvas application.
 * 
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */

export type ErrorCategory =
  | 'AUDIO_LOADING'
  | 'AUDIO_PROCESSING'
  | 'AI_SERVICE'
  | 'VISUALIZATION'
  | 'EXPORT'
  | 'NETWORK'
  | 'VALIDATION'
  | 'UNKNOWN';

export interface ErrorContext {
  component: string;
  operation: string;
  timestamp: number;
  userAction?: string;
  additionalData?: Record<string, unknown>;
}

export interface RecoveryResult {
  recovered: boolean;
  fallbackAction?: () => void | Promise<void>;
  message: string;
}

export interface UserNotification {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  suggestedAction?: string;
  technicalDetails?: string;
}

export interface NetworkRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
}

/**
 * ErrorHandler class for centralized error management
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: Error; context: ErrorContext }> = [];
  private notificationCallback?: (notification: UserNotification) => void;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Set callback for user notifications
   */
  public setNotificationCallback(callback: (notification: UserNotification) => void): void {
    this.notificationCallback = callback;
  }

  /**
   * Classify error into appropriate category
   * Requirement 8.1: Display user-friendly error messages
   */
  public classifyError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Audio loading errors
    if (
      message.includes('invalid file format') ||
      message.includes('corrupted audio') ||
      message.includes('duration exceeds') ||
      message.includes('audio file') ||
      message.includes('mp3') ||
      message.includes('ogg')
    ) {
      return 'AUDIO_LOADING';
    }

    // Audio processing errors
    if (
      message.includes('audio context') ||
      message.includes('web audio') ||
      message.includes('decoding') ||
      message.includes('audio api') ||
      errorName.includes('audiocontext')
    ) {
      return 'AUDIO_PROCESSING';
    }

    // AI service errors
    if (
      message.includes('ollama') ||
      message.includes('bedrock') ||
      message.includes('ai provider') ||
      message.includes('poetry generation') ||
      message.includes('authentication') ||
      message.includes('rate limit') ||
      message.includes('gpu')
    ) {
      return 'AI_SERVICE';
    }

    // Visualization errors
    if (
      message.includes('canvas') ||
      message.includes('webgl') ||
      message.includes('visualization') ||
      message.includes('rendering') ||
      message.includes('animation frame')
    ) {
      return 'VISUALIZATION';
    }

    // Export errors
    if (
      message.includes('export') ||
      message.includes('blob') ||
      message.includes('file system') ||
      message.includes('share url')
    ) {
      return 'EXPORT';
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('cors') ||
      message.includes('connection') ||
      errorName.includes('networkerror')
    ) {
      return 'NETWORK';
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return 'VALIDATION';
    }

    return 'UNKNOWN';
  }

  /**
   * Attempt to recover from error with fallback strategies
   * Requirement 8.3: Detect browser limitations and inform user
   */
  public async attemptRecovery(error: Error, context: ErrorContext): Promise<RecoveryResult> {
    const category = this.classifyError(error);

    switch (category) {
      case 'AUDIO_LOADING':
        return this.recoverFromAudioLoading(error);

      case 'AUDIO_PROCESSING':
        return this.recoverFromAudioProcessing(error);

      case 'AI_SERVICE':
        return this.recoverFromAIService(error);

      case 'VISUALIZATION':
        return this.recoverFromVisualization(error);

      case 'EXPORT':
        return this.recoverFromExport(error);

      case 'NETWORK':
        return this.recoverFromNetwork(error, context);

      default:
        return {
          recovered: false,
          message: 'Unable to recover from this error. Please try again or contact support.',
        };
    }
  }

  /**
   * Notify user with friendly error message
   * Requirement 8.1: Display user-friendly error messages
   * Requirement 8.5: Log errors while maintaining user experience
   */
  public notifyUser(error: Error, context: ErrorContext): void {
    const category = this.classifyError(error);
    const notification = this.createUserNotification(error, category, context);

    // Log to console for debugging
    console.error(`[ErrorHandler] ${category}:`, error, context);

    // Call notification callback if set
    if (this.notificationCallback) {
      this.notificationCallback(notification);
    }
  }

  /**
   * Log error for debugging
   * Requirement 8.5: Log error details for debugging
   */
  public logError(error: Error, context: ErrorContext): void {
    const logEntry = {
      error,
      context: {
        ...context,
        timestamp: Date.now(),
      },
    };

    this.errorLog.push(logEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console
    console.error('[ErrorHandler] Error logged:', {
      category: this.classifyError(error),
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  /**
   * Retry network operation with exponential backoff
   * Requirement 8.4: Retry network requests up to 3 times
   */
  public async retryNetworkOperation<T>(
    operation: () => Promise<T>,
    options: NetworkRetryOptions = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 3;
    const delayMs = options.delayMs ?? 1000;
    const backoff = options.backoff ?? true;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if not a network error
        if (this.classifyError(lastError) !== 'NETWORK') {
          throw lastError;
        }

        // Don't wait after last attempt
        if (attempt < maxAttempts) {
          const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Network operation failed after retries');
  }

  /**
   * Get error log for debugging
   */
  public getErrorLog(): Array<{ error: Error; context: ErrorContext }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Private helper methods

  private recoverFromAudioLoading(error: Error): RecoveryResult {
    if (error.message.toLowerCase().includes('duration exceeds')) {
      return {
        recovered: false,
        message: 'Audio file is too long. Please use a file under 5 minutes.',
      };
    }

    if (error.message.toLowerCase().includes('invalid file format')) {
      return {
        recovered: false,
        message: 'Invalid audio format. Please use MP3 or OGG files.',
      };
    }

    return {
      recovered: false,
      message: 'Failed to load audio file. Please try a different file.',
    };
  }

  private recoverFromAudioProcessing(error: Error): RecoveryResult {
    if (error.message.toLowerCase().includes('audio context')) {
      return {
        recovered: false,
        message: 'Your browser does not support Web Audio API. Please upgrade your browser.',
      };
    }

    return {
      recovered: false,
      message: 'Audio processing failed. Please try reloading the page.',
    };
  }

  private recoverFromAIService(error: Error): RecoveryResult {
    // AI service errors can be recovered with template fallback
    return {
      recovered: true,
      fallbackAction: () => {
        console.log('[ErrorHandler] Falling back to template-based poetry generation');
      },
      message: 'AI service unavailable. Using template-based poetry generation.',
    };
  }

  private recoverFromVisualization(error: Error): RecoveryResult {
    if (error.message.toLowerCase().includes('webgl')) {
      return {
        recovered: true,
        fallbackAction: () => {
          console.log('[ErrorHandler] Falling back to Canvas 2D rendering');
        },
        message: 'WebGL not supported. Using standard Canvas 2D rendering.',
      };
    }

    return {
      recovered: false,
      message: 'Visualization error. Please try reloading the page.',
    };
  }

  private recoverFromExport(error: Error): RecoveryResult {
    return {
      recovered: false,
      message: 'Export failed. Please try again or use a different format.',
    };
  }

  private recoverFromNetwork(error: Error, context: ErrorContext): RecoveryResult {
    return {
      recovered: false,
      message: `Network error during ${context.operation}. Please check your connection and try again.`,
    };
  }

  private createUserNotification(
    error: Error,
    category: ErrorCategory,
    context: ErrorContext
  ): UserNotification {
    const baseNotification: UserNotification = {
      type: 'error',
      title: this.getCategoryTitle(category),
      message: this.getUserFriendlyMessage(error, category),
      technicalDetails: error.message,
    };

    // Add suggested actions based on category
    switch (category) {
      case 'AUDIO_LOADING':
        baseNotification.suggestedAction = 'Try a different audio file (MP3 or OGG, under 5 minutes)';
        break;

      case 'AUDIO_PROCESSING':
        baseNotification.suggestedAction = 'Upgrade your browser or try a different one';
        break;

      case 'AI_SERVICE':
        baseNotification.suggestedAction = 'The system will use template-based poetry generation';
        baseNotification.type = 'warning';
        break;

      case 'VISUALIZATION':
        baseNotification.suggestedAction = 'Reload the page or try a different browser';
        break;

      case 'EXPORT':
        baseNotification.suggestedAction = 'Try again or use a different export format';
        break;

      case 'NETWORK':
        baseNotification.suggestedAction = 'Check your internet connection and try again';
        break;

      case 'VALIDATION':
        baseNotification.suggestedAction = 'Please check your input and try again';
        break;

      default:
        baseNotification.suggestedAction = 'Please try again or contact support';
    }

    return baseNotification;
  }

  private getCategoryTitle(category: ErrorCategory): string {
    const titles: Record<ErrorCategory, string> = {
      AUDIO_LOADING: 'Audio Loading Error',
      AUDIO_PROCESSING: 'Audio Processing Error',
      AI_SERVICE: 'AI Service Issue',
      VISUALIZATION: 'Visualization Error',
      EXPORT: 'Export Error',
      NETWORK: 'Network Error',
      VALIDATION: 'Validation Error',
      UNKNOWN: 'Unexpected Error',
    };

    return titles[category];
  }

  private getUserFriendlyMessage(error: Error, category: ErrorCategory): string {
    // Try to extract user-friendly message from error
    const message = error.message;

    // Return category-specific friendly messages
    switch (category) {
      case 'AUDIO_LOADING':
        if (message.includes('duration')) {
          return 'The audio file is too long. Please use a file under 5 minutes.';
        }
        if (message.includes('format')) {
          return 'The audio format is not supported. Please use MP3 or OGG files.';
        }
        return 'Unable to load the audio file. Please try a different file.';

      case 'AUDIO_PROCESSING':
        return 'Your browser does not support the required audio features. Please upgrade to a modern browser.';

      case 'AI_SERVICE':
        return 'The AI poetry service is temporarily unavailable. We\'ll use template-based generation instead.';

      case 'VISUALIZATION':
        return 'There was a problem with the visualization. The experience may continue with reduced visual effects.';

      case 'EXPORT':
        return 'Failed to export your creation. Please try again.';

      case 'NETWORK':
        return 'Network connection issue. Please check your internet connection.';

      case 'VALIDATION':
        return 'The provided input is invalid. Please check and try again.';

      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
