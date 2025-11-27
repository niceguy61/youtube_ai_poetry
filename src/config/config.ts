/**
 * Centralized configuration for the Music Poetry Canvas application
 * All configurable values should be defined here
 */

/**
 * Environment detection
 * Determines if the application is running in development or production mode
 */
export const ENV = {
  MODE: import.meta.env.MODE as 'development' | 'production' | 'test',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
} as const;

/**
 * Main application configuration
 * Organized by functional area with sensible defaults
 */
export const CONFIG = {
  /**
   * Audio processing configuration
   * Controls audio analysis and playback behavior
   */
  audio: {
    MAX_DURATION: 300, // 5 minutes in seconds (requirement 1.4, 1.5, 1.6)
    SAMPLE_RATE: 44100, // Standard CD quality sample rate
    FFT_SIZE: 2048, // Fast Fourier Transform size for frequency analysis
    SMOOTHING_TIME_CONSTANT: 0.8, // Smoothing for frequency data (0-1)
    MIN_DECIBELS: -90, // Minimum decibel value for frequency analysis
    MAX_DECIBELS: -10, // Maximum decibel value for frequency analysis
  },

  /**
   * Visualization configuration
   * Controls rendering behavior and visual effects
   */
  visualization: {
    TARGET_FPS: 60, // Target frames per second for smooth animation
    SMOOTHING: 0.8, // Smoothing factor for visual transitions (0-1)
    DEFAULT_MODE: 'gradient' as const, // Default visualization mode on startup
    ENABLE_WEBGL: true, // Enable WebGL acceleration when available
    FALLBACK_TO_2D: true, // Fall back to Canvas 2D if WebGL unavailable
  },

  /**
   * AI provider configuration
   * Supports both local (Ollama) and cloud (Bedrock) providers
   * Requirements: 11.1, 11.6
   */
  ai: {
    PROVIDER: (import.meta.env.VITE_AI_PROVIDER || 'ollama') as 'ollama' | 'bedrock',
    
    // Ollama configuration (local development)
    OLLAMA_ENDPOINT: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434',
    OLLAMA_MODEL: import.meta.env.VITE_OLLAMA_MODEL || 'gemma3:4b',
    OLLAMA_MIN_GPU_MEMORY: 12, // Minimum GPU memory in GB (RTX 3060 requirement)
    
    // AWS Bedrock configuration (production)
    BEDROCK_REGION: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    BEDROCK_MODEL_ID: import.meta.env.VITE_AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
    
    // Generation parameters
    GENERATION_TIMEOUT: 180000, // 3 minutes (180 seconds) timeout for AI generation
    MAX_TOKENS: 200, // Maximum tokens for poetry generation
    TEMPERATURE: 0.7, // Creativity parameter (0-1)
    TOP_P: 0.9, // Nucleus sampling parameter
  },

  /**
   * Poetry generation configuration
   * Controls timing and storage of generated poetry
   */
  poetry: {
    MIN_INTERVAL: 30000, // Minimum 30 seconds between automatic generations
    MAX_POEMS_STORED: 50, // Maximum number of poems to keep in memory
    ENABLE_STREAMING: true, // Enable streaming generation for real-time display
    FALLBACK_TO_TEMPLATES: true, // Use templates when AI unavailable
    AUTO_GENERATE: true, // Enable automatic poetry generation at intervals
  },

  /**
   * Canvas configuration
   * Default dimensions and interaction settings
   */
  canvas: {
    DEFAULT_WIDTH: 1920,
    DEFAULT_HEIGHT: 1080,
    ENABLE_TOUCH: true, // Enable touch interactions
    ENABLE_MOUSE: true, // Enable mouse interactions
    INTERACTION_DEBOUNCE: 50, // Debounce time for interactions in ms
  },

  /**
   * API configuration
   * Backend API endpoints for Lambda functions
   */
  api: {
    ENDPOINT: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001',
    YOUTUBE_BACKEND_URL: import.meta.env.VITE_YOUTUBE_BACKEND_URL || 'http://localhost:3001',
    TIMEOUT: 60000, // 60 seconds timeout for API requests
  },

  /**
   * Export configuration
   * Settings for exporting poetry and canvas
   */
  export: {
    IMAGE_FORMAT: 'png' as const,
    IMAGE_QUALITY: 0.95, // Quality for JPEG exports (0-1)
    INCLUDE_METADATA: true, // Include metadata in exports
    MAX_SHARE_URL_LENGTH: 2048, // Maximum length for share URLs
  },

  /**
   * Storytelling configuration
   * Controls narrative elements and guidance
   */
  storytelling: {
    ENABLED: true,
    STYLE: 'descriptive' as const,
    SHOW_INTRO: true, // Show introduction narrative
    SHOW_HINTS: true, // Show guidance hints
    SHOW_SUMMARY: true, // Show experience summary
  },

  /**
   * Error handling configuration
   * Controls retry logic and error reporting
   */
  error: {
    MAX_RETRIES: 3, // Maximum retry attempts for network requests
    RETRY_DELAY: 1000, // Delay between retries in ms
    SHOW_TECHNICAL_DETAILS: ENV.IS_DEV, // Show technical error details in dev mode
    LOG_ERRORS: true, // Log errors to console
  },

  /**
   * Performance configuration
   * Settings for optimization and resource management
   */
  performance: {
    ENABLE_WEB_WORKERS: true, // Use Web Workers for heavy computations
    LAZY_LOAD_VISUALIZATIONS: true, // Lazy load visualization modes
    CACHE_AI_RESPONSES: true, // Cache AI responses to reduce API calls
    MAX_CACHE_SIZE: 100, // Maximum number of cached AI responses
  },
} as const;

/**
 * Type exports for configuration
 */
export type AIProvider = typeof CONFIG.ai.PROVIDER;
export type VisualizationMode = 'gradient' | 'equalizer' | 'spotlight' | 'combined';
export type NarrativeStyle = 'minimal' | 'descriptive' | 'poetic' | 'technical';
export type LogLevel = typeof ENV.LOG_LEVEL;
export type Environment = typeof ENV.MODE;

/**
 * Helper functions for configuration
 */
export const ConfigHelpers = {
  /**
   * Check if running in development mode
   */
  isDevelopment: (): boolean => ENV.IS_DEV,

  /**
   * Check if running in production mode
   */
  isProduction: (): boolean => ENV.IS_PROD,

  /**
   * Get the current environment name
   */
  getEnvironment: (): Environment => ENV.MODE,

  /**
   * Check if a specific log level should be shown
   */
  shouldLog: (level: LogLevel): boolean => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(ENV.LOG_LEVEL);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  },

  /**
   * Get AI provider configuration based on current provider
   */
  getAIProviderConfig: () => {
    if (CONFIG.ai.PROVIDER === 'ollama') {
      return {
        provider: 'ollama' as const,
        endpoint: CONFIG.ai.OLLAMA_ENDPOINT,
        model: CONFIG.ai.OLLAMA_MODEL,
        minGPUMemory: CONFIG.ai.OLLAMA_MIN_GPU_MEMORY,
      };
    } else {
      return {
        provider: 'bedrock' as const,
        region: CONFIG.ai.BEDROCK_REGION,
        modelId: CONFIG.ai.BEDROCK_MODEL_ID,
      };
    }
  },

  /**
   * Validate configuration on startup
   */
  validate: (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate audio configuration
    if (CONFIG.audio.MAX_DURATION <= 0) {
      errors.push('Audio MAX_DURATION must be positive');
    }
    if (CONFIG.audio.FFT_SIZE < 32 || CONFIG.audio.FFT_SIZE > 32768) {
      errors.push('Audio FFT_SIZE must be between 32 and 32768');
    }

    // Validate visualization configuration
    if (CONFIG.visualization.TARGET_FPS <= 0) {
      errors.push('Visualization TARGET_FPS must be positive');
    }

    // Validate AI configuration
    if (!['ollama', 'bedrock'].includes(CONFIG.ai.PROVIDER)) {
      errors.push('AI PROVIDER must be either "ollama" or "bedrock"');
    }

    // Validate poetry configuration
    if (CONFIG.poetry.MIN_INTERVAL < 0) {
      errors.push('Poetry MIN_INTERVAL must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
