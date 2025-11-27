/**
 * Ollama Provider - Local AI model service implementation
 * Runs on consumer hardware (RTX 3060 compatible)
 */

import { AIProviderService } from './AIProviderService';
import type {
  AIProvider,
  GenerationOptions,
  ProviderConfig,
  ResourceStatus,
} from '../types/poetry';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    stop?: string[];
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
    digest: string;
  }>;
}

export class OllamaProvider extends AIProviderService {
  private endpoint: string;
  private model: string;

  constructor(config: ProviderConfig) {
    super('ollama', config);
    
    if (!config.ollama) {
      throw new Error('Ollama configuration is required');
    }

    this.endpoint = config.ollama.endpoint;
    this.model = config.ollama.model;
  }

  async setProvider(provider: AIProvider, config: ProviderConfig): Promise<void> {
    if (provider !== 'ollama') {
      throw new Error('OllamaProvider can only be set to ollama provider');
    }

    if (!config.ollama) {
      throw new Error('Ollama configuration is required');
    }

    this.currentProvider = provider;
    this.config = config;
    this.endpoint = config.ollama.endpoint;
    this.model = config.ollama.model;

    // Verify the provider is available
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Ollama service is not available at the configured endpoint');
    }
  }

  async generate(prompt: string, options: GenerationOptions): Promise<string> {
    const requestBody: OllamaGenerateRequest = {
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
        top_p: options.topP,
        stop: options.stopSequences,
      },
    };

    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaGenerateResponse = await response.json();
      
      // Handle empty response (common with thinking models that hit token limit)
      if (!data.response || data.response.trim() === '') {
        console.warn('[OllamaProvider] Empty response received, model may have hit token limit during thinking phase');
        throw new Error('Model returned empty response. Try increasing maxTokens or using a different model.');
      }
      
      return data.response;
    } catch (error) {
      console.error('[OllamaProvider] Generation failed:', error);
      throw new Error(
        `Failed to generate text with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateStream(
    prompt: string,
    options: GenerationOptions,
    callback: (chunk: string) => void
  ): Promise<void> {
    const requestBody: OllamaGenerateRequest = {
      model: this.model,
      prompt,
      stream: true,
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
        top_p: options.topP,
        stop: options.stopSequences,
      },
    };

    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let hasReceivedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaGenerateResponse = JSON.parse(line);
              if (data.response) {
                hasReceivedContent = true;
                callback(data.response);
              }
            } catch (e) {
              console.warn('[OllamaProvider] Failed to parse streaming response:', e);
            }
          }
        }
      }
      
      // Check if we received any content
      if (!hasReceivedContent) {
        console.warn('[OllamaProvider] No content received in stream, model may have hit token limit during thinking phase');
        throw new Error('Model returned empty response. Try increasing maxTokens or using a different model.');
      }
    } catch (error) {
      console.error('[OllamaProvider] Streaming generation failed:', error);
      throw new Error(
        `Failed to stream text with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        return false;
      }

      const data: OllamaTagsResponse = await response.json();
      
      // Check if the configured model is available
      const modelAvailable = data.models.some(m => m.name === this.model);
      
      return modelAvailable;
    } catch (error) {
      console.error('[OllamaProvider] Availability check failed:', error);
      return false;
    }
  }

  async checkResources(): Promise<ResourceStatus> {
    try {
      // Check if service is available first
      const available = await this.isAvailable();
      
      if (!available) {
        return {
          available: false,
          message: `Ollama service is not available or model '${this.model}' is not installed`,
        };
      }

      // For Ollama, we can't directly check GPU resources via API
      // But we can verify the service is responding
      return {
        available: true,
        message: 'Ollama service is available and ready',
      };
    } catch (error) {
      return {
        available: false,
        message: `Resource check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
