# AI Provider Service

This directory contains the AI Provider Service abstraction layer for the Music Poetry Canvas application.

## Overview

The AI Provider Service provides a unified interface for accessing different AI models:
- **Ollama**: Local AI models running on consumer hardware (RTX 3060 compatible)
- **AWS Bedrock**: Cloud-based AI service with Claude models

## Architecture

```
AIProviderService (abstract base class)
    ├── OllamaProvider (local implementation)
    └── BedrockProvider (cloud implementation)

AIProviderFactory (creates appropriate provider)
```

## Usage

### Basic Usage

```typescript
import { createAIProvider, getDefaultGenerationOptions } from './services/AIProviderFactory';

// Create provider (uses configuration from environment)
const aiProvider = createAIProvider();

// Check if available
const isAvailable = await aiProvider.isAvailable();

if (isAvailable) {
  // Generate text
  const options = getDefaultGenerationOptions();
  const poetry = await aiProvider.generate('Write a poem about music', options);
  console.log(poetry);
}
```

### Custom Configuration

```typescript
import { createAIProvider } from './services/AIProviderFactory';
import type { ProviderConfig } from './types/poetry';

const customConfig: ProviderConfig = {
  ollama: {
    endpoint: 'http://custom-host:11434',
    model: 'mistral',
  },
};

const aiProvider = createAIProvider('ollama', customConfig);
```

### Streaming Generation

```typescript
const options = getDefaultGenerationOptions();

await aiProvider.generateStream(
  'Write a poem about music',
  options,
  (chunk) => {
    // Handle each chunk as it arrives
    console.log(chunk);
  }
);
```

### Switching Providers

```typescript
// Start with Ollama
const aiProvider = createAIProvider('ollama');

// Switch to Bedrock
const bedrockConfig: ProviderConfig = {
  bedrock: {
    region: 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
};

await aiProvider.setProvider('bedrock', bedrockConfig);
```

### Resource Checking

```typescript
// Check resources (GPU for Ollama, credentials for Bedrock)
const resourceStatus = await aiProvider.checkResources();

if (resourceStatus.available) {
  console.log('Provider is ready:', resourceStatus.message);
} else {
  console.error('Provider not available:', resourceStatus.message);
}
```

## Configuration

### Environment Variables

#### Ollama Configuration
```bash
VITE_AI_PROVIDER=ollama
VITE_OLLAMA_ENDPOINT=http://localhost:11434
VITE_OLLAMA_MODEL=gemma3:4b
```

#### Bedrock Configuration
```bash
VITE_AI_PROVIDER=bedrock
VITE_AWS_REGION=us-east-1
VITE_AWS_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Files

- `AIProviderService.ts` - Abstract base class defining the provider interface
- `OllamaProvider.ts` - Ollama implementation for local AI models
- `BedrockProvider.ts` - AWS Bedrock implementation for cloud AI
- `AIProviderFactory.ts` - Factory for creating provider instances
- `AIProviderService.test.ts` - Comprehensive unit tests

## Requirements Satisfied

This implementation satisfies the following requirements:
- **3.6**: AI provider configuration support
- **11.1**: Read AI provider configuration from environment
- **11.2**: Ollama API connection
- **11.3**: AWS Bedrock connection

## Notes

### Ollama
- Requires Ollama service running locally
- Compatible with RTX 3060 (12GB VRAM)
- Models must be installed via `ollama pull <model>`
- No authentication required for local use

### Bedrock
- Requires AWS SDK (not included by default)
- Install with: `npm install @aws-sdk/client-bedrock-runtime`
- Requires valid AWS credentials
- Managed service - no GPU setup needed
- Pay-per-use pricing

## Error Handling

All methods include comprehensive error handling:
- Network errors are caught and logged
- API errors include status codes and messages
- Unavailable services return false from `isAvailable()`
- Resource checks provide detailed status messages

## Testing

Run tests with:
```bash
npm test src/services/AIProviderService.test.ts
```

Tests cover:
- Provider initialization
- Configuration management
- Text generation (mocked)
- Availability checks
- Resource verification
- Error handling
- Factory creation

## Future Enhancements

Potential improvements:
- Add retry logic with exponential backoff
- Implement request caching
- Add metrics and monitoring
- Support additional providers (OpenAI, Anthropic direct)
- Add request queuing for rate limiting
