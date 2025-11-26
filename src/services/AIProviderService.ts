/**
 * AI Provider Service - Abstraction layer for AI model access
 * Supports both Ollama (local) and AWS Bedrock (cloud) providers
 */

import type {
  AIProvider,
  GenerationOptions,
  ProviderConfig,
  ResourceStatus,
} from '../types/poetry';

/**
 * Abstract base class for AI providers
 * Defines the contract that all providers must implement
 */
export abstract class AIProviderService {
  protected config: ProviderConfig;
  protected currentProvider: AIProvider;

  constructor(provider: AIProvider, config: ProviderConfig) {
    this.currentProvider = provider;
    this.config = config;
  }

  /**
   * Set the AI provider and configuration
   */
  abstract setProvider(provider: AIProvider, config: ProviderConfig): Promise<void>;

  /**
   * Get the current provider
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Generate text from a prompt
   */
  abstract generate(prompt: string, options: GenerationOptions): Promise<string>;

  /**
   * Generate text with streaming support
   */
  abstract generateStream(
    prompt: string,
    options: GenerationOptions,
    callback: (chunk: string) => void
  ): Promise<void>;

  /**
   * Check if the provider is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Check resource status (GPU, memory, etc.)
   */
  abstract checkResources(): Promise<ResourceStatus>;
}
