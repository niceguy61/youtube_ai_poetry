# Configuration System

This directory contains the centralized configuration for the Music Poetry Canvas application.

## Overview

The configuration system provides:
- **Centralized settings**: All configurable values in one place
- **Environment detection**: Automatic dev/prod mode detection
- **Type safety**: Full TypeScript support with exported types
- **Validation**: Built-in configuration validation
- **Helper functions**: Utilities for common configuration tasks

## Usage

### Basic Import

```typescript
import { CONFIG, ENV, ConfigHelpers } from '../config/config';
```

### Accessing Configuration

```typescript
// Audio settings
const maxDuration = CONFIG.audio.MAX_DURATION; // 300 seconds
const fftSize = CONFIG.audio.FFT_SIZE; // 2048

// Visualization settings
const targetFPS = CONFIG.visualization.TARGET_FPS; // 60
const defaultMode = CONFIG.visualization.DEFAULT_MODE; // 'gradient'

// AI provider settings
const provider = CONFIG.ai.PROVIDER; // 'ollama' | 'bedrock'
const ollamaEndpoint = CONFIG.ai.OLLAMA_ENDPOINT;
const bedrockRegion = CONFIG.ai.BEDROCK_REGION;
```

### Environment Detection

```typescript
import { ENV, ConfigHelpers } from '../config/config';

// Check environment
if (ENV.IS_DEV) {
  console.log('Running in development mode');
}

if (ConfigHelpers.isProduction()) {
  // Production-specific logic
}

// Get current environment
const env = ConfigHelpers.getEnvironment(); // 'development' | 'production' | 'test'
```

### Log Level Management

```typescript
import { ConfigHelpers } from '../config/config';

// Check if a log level should be shown
if (ConfigHelpers.shouldLog('debug')) {
  console.debug('Debug information');
}

if (ConfigHelpers.shouldLog('error')) {
  console.error('Error occurred');
}
```

### AI Provider Configuration

```typescript
import { ConfigHelpers } from '../config/config';

// Get provider-specific configuration
const providerConfig = ConfigHelpers.getAIProviderConfig();

if (providerConfig.provider === 'ollama') {
  console.log(`Connecting to Ollama at ${providerConfig.endpoint}`);
  console.log(`Using model: ${providerConfig.model}`);
} else {
  console.log(`Using AWS Bedrock in region ${providerConfig.region}`);
  console.log(`Model ID: ${providerConfig.modelId}`);
}
```

### Configuration Validation

```typescript
import { ConfigHelpers } from '../config/config';

// Validate configuration on startup
const validation = ConfigHelpers.validate();

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  // Handle configuration errors
} else {
  console.log('Configuration is valid');
}
```

## Environment Variables

Configuration values can be overridden using environment variables. All environment variables must be prefixed with `VITE_` to be accessible in the browser.

### Development (.env.development)

```bash
VITE_AI_PROVIDER=ollama
VITE_OLLAMA_ENDPOINT=http://localhost:11434
VITE_OLLAMA_MODEL=gemma3:4b
VITE_LOG_LEVEL=debug
```

### Production (.env.production)

```bash
VITE_AI_PROVIDER=bedrock
VITE_AWS_REGION=us-east-1
VITE_AWS_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
VITE_LOG_LEVEL=error
```

### Available Environment Variables

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `VITE_AI_PROVIDER` | AI provider to use | `ollama` | `ollama`, `bedrock` |
| `VITE_OLLAMA_ENDPOINT` | Ollama API endpoint | `http://localhost:11434` | Any valid URL |
| `VITE_OLLAMA_MODEL` | Ollama model name | `gemma3:4b` | Any Ollama model |
| `VITE_AWS_REGION` | AWS region for Bedrock | `us-east-1` | Any AWS region |
| `VITE_AWS_BEDROCK_MODEL_ID` | Bedrock model ID | `anthropic.claude-3-haiku-20240307-v1:0` | Any Bedrock model |
| `VITE_LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |

## Configuration Structure

### Audio Configuration

Controls audio processing and analysis:

```typescript
CONFIG.audio = {
  MAX_DURATION: 300,              // Maximum audio duration (5 minutes)
  SAMPLE_RATE: 44100,             // Audio sample rate
  FFT_SIZE: 2048,                 // FFT size for frequency analysis
  SMOOTHING_TIME_CONSTANT: 0.8,  // Smoothing factor (0-1)
  MIN_DECIBELS: -90,              // Minimum decibel value
  MAX_DECIBELS: -10,              // Maximum decibel value
}
```

### Visualization Configuration

Controls rendering and visual effects:

```typescript
CONFIG.visualization = {
  TARGET_FPS: 60,                 // Target frame rate
  SMOOTHING: 0.8,                 // Visual smoothing factor
  DEFAULT_MODE: 'gradient',       // Default visualization mode
  ENABLE_WEBGL: true,             // Enable WebGL acceleration
  FALLBACK_TO_2D: true,           // Fall back to Canvas 2D
}
```

### AI Configuration

Controls AI provider settings:

```typescript
CONFIG.ai = {
  PROVIDER: 'ollama',                    // Current provider
  OLLAMA_ENDPOINT: 'http://localhost:11434',
  OLLAMA_MODEL: 'gemma3:4b',
  OLLAMA_MIN_GPU_MEMORY: 12,             // Minimum GPU memory (GB)
  BEDROCK_REGION: 'us-east-1',
  BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
  GENERATION_TIMEOUT: 10000,             // Timeout in ms
  MAX_TOKENS: 200,                       // Max tokens per generation
  TEMPERATURE: 0.7,                      // Creativity (0-1)
  TOP_P: 0.9,                            // Nucleus sampling
}
```

### Poetry Configuration

Controls poetry generation:

```typescript
CONFIG.poetry = {
  MIN_INTERVAL: 5000,              // Min time between generations (ms)
  MAX_POEMS_STORED: 50,            // Max poems in memory
  ENABLE_STREAMING: true,          // Enable streaming generation
  FALLBACK_TO_TEMPLATES: true,     // Use templates on AI failure
}
```

### Error Handling Configuration

Controls error handling behavior:

```typescript
CONFIG.error = {
  MAX_RETRIES: 3,                  // Max retry attempts
  RETRY_DELAY: 1000,               // Delay between retries (ms)
  SHOW_TECHNICAL_DETAILS: ENV.IS_DEV,  // Show details in dev
  LOG_ERRORS: true,                // Log errors to console
}
```

### Performance Configuration

Controls optimization settings:

```typescript
CONFIG.performance = {
  ENABLE_WEB_WORKERS: true,        // Use Web Workers
  LAZY_LOAD_VISUALIZATIONS: true,  // Lazy load viz modes
  CACHE_AI_RESPONSES: true,        // Cache AI responses
  MAX_CACHE_SIZE: 100,             // Max cached responses
}
```

## Type Exports

The configuration module exports several useful types:

```typescript
import type { 
  AIProvider,           // 'ollama' | 'bedrock'
  VisualizationMode,    // 'gradient' | 'equalizer' | 'spotlight' | 'combined'
  NarrativeStyle,       // 'minimal' | 'descriptive' | 'poetic' | 'technical'
  LogLevel,             // 'debug' | 'info' | 'warn' | 'error'
  Environment           // 'development' | 'production' | 'test'
} from '../config/config';
```

## Best Practices

1. **Always use CONFIG**: Never hardcode values that might change
2. **Validate on startup**: Call `ConfigHelpers.validate()` during initialization
3. **Use environment detection**: Adapt behavior based on `ENV.IS_DEV` / `ENV.IS_PROD`
4. **Respect log levels**: Use `ConfigHelpers.shouldLog()` before logging
5. **Document new settings**: Add comments explaining what each setting does

## Examples

### Example 1: Audio Processing

```typescript
import { CONFIG } from '../config/config';

class AudioProcessor {
  initialize() {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = CONFIG.audio.FFT_SIZE;
    analyser.smoothingTimeConstant = CONFIG.audio.SMOOTHING_TIME_CONSTANT;
    analyser.minDecibels = CONFIG.audio.MIN_DECIBELS;
    analyser.maxDecibels = CONFIG.audio.MAX_DECIBELS;
  }
}
```

### Example 2: Duration Validation

```typescript
import { CONFIG } from '../config/config';

function validateDuration(duration: number): boolean {
  if (duration > CONFIG.audio.MAX_DURATION) {
    console.error(`Duration ${duration}s exceeds limit of ${CONFIG.audio.MAX_DURATION}s`);
    return false;
  }
  return true;
}
```

### Example 3: Environment-Specific Behavior

```typescript
import { ENV, ConfigHelpers } from '../config/config';

function setupLogging() {
  if (ConfigHelpers.isDevelopment()) {
    console.log('Development mode - verbose logging enabled');
    enableVerboseLogging();
  } else {
    console.log('Production mode - minimal logging');
    enableMinimalLogging();
  }
}
```

### Example 4: AI Provider Setup

```typescript
import { ConfigHelpers } from '../config/config';

async function initializeAI() {
  const config = ConfigHelpers.getAIProviderConfig();
  
  if (config.provider === 'ollama') {
    return new OllamaProvider({
      endpoint: config.endpoint,
      model: config.model,
      minGPUMemory: config.minGPUMemory
    });
  } else {
    return new BedrockProvider({
      region: config.region,
      modelId: config.modelId
    });
  }
}
```

## Testing

The configuration system includes comprehensive tests. Run them with:

```bash
npm test -- src/config/config.test.ts
```

Tests cover:
- All configuration sections
- Environment detection
- Helper functions
- Configuration validation
- Type safety

## Requirements Mapping

This configuration system satisfies the following requirements:

- **Requirement 11.1**: AI provider configuration from environment variables
- **Requirement 11.6**: Provider switching without code changes
- **Audio processing parameters**: FFT size, sample rate, smoothing
- **Visualization settings**: FPS, smoothing, default mode
- **Environment detection**: Development vs production mode

## Related Files

- `config.ts` - Main configuration file
- `config.test.ts` - Configuration tests
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables
- `.env.example` - Example environment variables

## Support

For questions or issues with configuration:
1. Check this README
2. Review the inline comments in `config.ts`
3. Look at usage examples in the codebase
4. Consult the steering documents
