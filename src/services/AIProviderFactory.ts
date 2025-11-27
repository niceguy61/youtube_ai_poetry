/**
 * AI Provider Factory - Creates the appropriate AI provider based on configuration
 */

import { CONFIG } from '../config/config';
import { AIProviderService } from './AIProviderService';
import { OllamaProvider } from './OllamaProvider';
import { BedrockProvider } from './BedrockProvider';
import { OpenAIProvider } from './OpenAIProvider';
import type { AIProvider, ProviderConfig } from '../types/poetry';

/**
 * Create an AI provider instance based on configuration
 */
export function createAIProvider(
  provider?: AIProvider,
  customConfig?: ProviderConfig
): AIProviderService {
  const selectedProvider = provider || CONFIG.ai.PROVIDER;
  
  // Build configuration from environment or custom config
  const config: ProviderConfig = customConfig || {
    ollama: {
      endpoint: CONFIG.ai.OLLAMA_ENDPOINT,
      model: CONFIG.ai.OLLAMA_MODEL,
    },
    bedrock: {
      region: CONFIG.ai.BEDROCK_REGION,
      modelId: CONFIG.ai.BEDROCK_MODEL_ID,
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
      },
    },
    openai: {
      apiKey: '', // Will be set from settings store
      model: 'gpt-3.5-turbo',
    },
  };

  switch (selectedProvider) {
    case 'ollama':
      return new OllamaProvider(config);
    
    case 'bedrock':
      return new BedrockProvider(config);
    
    case 'openai':
      return new OpenAIProvider(config);
    
    default:
      throw new Error(`Unknown AI provider: ${selectedProvider}`);
  }
}

/**
 * Get default generation options from configuration
 */
export function getDefaultGenerationOptions() {
  return {
    temperature: CONFIG.ai.TEMPERATURE,
    maxTokens: CONFIG.ai.MAX_TOKENS,
    topP: 0.9,
    stopSequences: ['\n\n\n'],
  };
}
