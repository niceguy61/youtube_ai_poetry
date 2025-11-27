/**
 * OpenAI Provider - Cloud-based AI model service implementation
 * Uses OpenAI's API for poetry generation
 */

import { AIProviderService } from './AIProviderService';
import type {
  AIProvider,
  GenerationOptions,
  ProviderConfig,
  ResourceStatus,
} from '../types/poetry';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string[];
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export class OpenAIProvider extends AIProviderService {
  private apiKey: string | null;
  private model: string;
  private endpoint = 'https://api.openai.com/v1/chat/completions';

  constructor(config: ProviderConfig) {
    super('openai', config);
    
    if (!config.openai) {
      throw new Error('OpenAI configuration is required');
    }

    // Allow initialization without API key, but it will fail when trying to generate
    this.apiKey = config.openai.apiKey || null;
    this.model = config.openai.model || 'gpt-3.5-turbo';
  }

  async setProvider(provider: AIProvider, config: ProviderConfig): Promise<void> {
    if (provider !== 'openai') {
      throw new Error('OpenAIProvider can only be set to openai provider');
    }

    if (!config.openai) {
      throw new Error('OpenAI configuration is required');
    }

    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.currentProvider = provider;
    this.config = config;
    this.apiKey = config.openai.apiKey;
    this.model = config.openai.model || 'gpt-3.5-turbo';

    // Verify the provider is available
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('OpenAI service is not available or API key is invalid');
    }
  }

  async generate(prompt: string, options: GenerationOptions): Promise<string> {
    // Check if API key is available
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required. Please configure your API key in settings.');
    }

    const requestBody: OpenAIRequest = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stopSequences,
      stream: false,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}${
            errorData.error?.message ? ` - ${errorData.error.message}` : ''
          }`
        );
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('[OpenAIProvider] Generation failed:', error);
      throw new Error(
        `Failed to generate text with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateStream(
    prompt: string,
    options: GenerationOptions,
    callback: (chunk: string) => void
  ): Promise<void> {
    const requestBody: OpenAIRequest = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stopSequences,
      stream: true,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}${
            errorData.error?.message ? ` - ${errorData.error.message}` : ''
          }`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed: OpenAIStreamChunk = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              
              if (content) {
                callback(content);
              }
            } catch (e) {
              console.warn('[OpenAIProvider] Failed to parse streaming response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('[OpenAIProvider] Streaming generation failed:', error);
      throw new Error(
        `Failed to stream text with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    // If no API key, not available
    if (!this.apiKey) {
      return false;
    }

    try {
      // Make a minimal request to check if the API key is valid
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[OpenAIProvider] Availability check failed:', error);
      return false;
    }
  }

  async checkResources(): Promise<ResourceStatus> {
    try {
      const available = await this.isAvailable();
      
      if (!available) {
        return {
          available: false,
          message: 'OpenAI service is not available or API key is invalid',
        };
      }

      return {
        available: true,
        message: 'OpenAI service is available and ready',
      };
    } catch (error) {
      return {
        available: false,
        message: `Resource check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
