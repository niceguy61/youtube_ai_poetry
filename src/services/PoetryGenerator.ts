/**
 * Poetry Generator - AI-powered poetry generation based on audio features and interactions
 * Supports multiple generation modes and streaming output
 */

import type { AudioFeatures } from '../types/audio';
import type { InteractionData } from '../types/canvas';
import type {
  AIProvider,
  PoetryStyle,
  GenerationOptions,
  Poem,
  PoetryGeneratorConfig,
  ProviderConfig,
} from '../types/poetry';
import type { Persona } from '../types/persona';
import type { Language } from '../types/language';
import { AIProviderService } from './AIProviderService';
import { createAIProvider, getDefaultGenerationOptions } from './AIProviderFactory';
import { TemplateFallbackProvider } from './TemplateFallbackProvider';
import { CONFIG } from '../config/config';
import { getPersona } from '../config/personas';
import { getLanguage } from '../config/languages';
import { getPersonaTemplate } from '../config/personaTemplates';

/**
 * Poetry Generator class
 * Generates poetry using AI based on audio features, mood, and user interactions
 */
export class PoetryGenerator {
  private provider: AIProviderService;
  private fallbackProvider: TemplateFallbackProvider;
  private currentStyle: PoetryStyle;
  private generatedPoems: Poem[] = [];
  private config: PoetryGeneratorConfig;

  constructor(config?: PoetryGeneratorConfig, provider?: AIProvider) {
    // Use provided config or defaults
    this.config = config || this.getDefaultConfig();
    
    // Initialize provider based on config
    const providerType = config?.provider || provider || 'ollama';
    
    // Build provider config from PoetryGeneratorConfig
    const providerConfig: ProviderConfig = {
      ollama: {
        endpoint: CONFIG.ai.OLLAMA_ENDPOINT,
        model: this.config.model || CONFIG.ai.OLLAMA_MODEL,
      },
      bedrock: {
        region: CONFIG.ai.BEDROCK_REGION,
        modelId: CONFIG.ai.BEDROCK_MODEL_ID,
      },
      openai: {
        apiKey: this.config.apiKey || '',
        model: this.config.model,
      },
    };
    
    this.provider = createAIProvider(providerType as AIProvider, providerConfig);
    
    this.fallbackProvider = new TemplateFallbackProvider();
    this.currentStyle = this.getDefaultStyle();
  }

  /**
   * Initialize the poetry generator with a specific provider
   */
  async initialize(provider?: AIProvider): Promise<void> {
    if (provider) {
      this.provider = createAIProvider(provider);
    }

    // Verify provider is available
    const available = await this.provider.isAvailable();
    if (!available) {
      console.warn('[PoetryGenerator] AI provider is not available, will use fallback templates');
    }
  }

  /**
   * Generate poetry from audio features
   * Analyzes tempo, energy, mood and creates appropriate poetry
   */
  async generateFromAudio(features: AudioFeatures): Promise<string> {
    const prompt = this.buildAudioPrompt(features);
    const options = this.getGenerationOptions();

    try {
      const poetry = await this.generateWithTimeout(prompt, options);
      
      // Store the generated poem
      this.storePoem(poetry, features);
      
      return poetry;
    } catch (error) {
      console.error('[PoetryGenerator] Failed to generate from audio:', error);
      // Fallback to template-based generation
      return this.generateFromTemplate(features);
    }
  }

  /**
   * Generate poetry from a mood descriptor
   * Useful for mood-based generation without full audio analysis
   */
  async generateFromMood(mood: string): Promise<string> {
    const prompt = this.buildMoodPrompt(mood);
    const options = this.getGenerationOptions();

    try {
      const poetry = await this.generateWithTimeout(prompt, options);
      return poetry;
    } catch (error) {
      console.error('[PoetryGenerator] Failed to generate from mood:', error);
      // Fallback to template
      return this.getTemplateForMood(mood);
    }
  }

  /**
   * Generate poetry from canvas interaction
   * Incorporates user interaction data into poetry generation
   */
  async generateFromInteraction(
    interaction: InteractionData,
    audioFeatures?: AudioFeatures
  ): Promise<string> {
    const prompt = this.buildInteractionPrompt(interaction, audioFeatures);
    const options = this.getGenerationOptions();

    try {
      const poetry = await this.generateWithTimeout(prompt, options);
      
      if (audioFeatures) {
        this.storePoem(poetry, audioFeatures);
      }
      
      return poetry;
    } catch (error) {
      console.error('[PoetryGenerator] Failed to generate from interaction:', error);
      // Fallback to template
      return audioFeatures 
        ? this.generateFromTemplate(audioFeatures)
        : this.getTemplateForMood('calm');
    }
  }

  /**
   * Generate poetry with streaming support
   * Calls the callback function with each chunk of generated text
   */
  async generateStream(
    features: AudioFeatures,
    callback: (chunk: string) => void
  ): Promise<void> {
    const prompt = this.buildAudioPrompt(features);
    const options = this.getGenerationOptions();

    try {
      let fullText = '';
      
      await this.provider.generateStream(prompt, options, (chunk: string) => {
        fullText += chunk;
        callback(chunk);
      });

      // Store the complete poem
      this.storePoem(fullText, features);
    } catch (error) {
      console.error('[PoetryGenerator] Failed to stream generation:', error);
      // Fallback: send template as single chunk
      const template = this.generateFromTemplate(features);
      callback(template);
    }
  }

  /**
   * Set the poetry style for generation
   */
  setStyle(style: PoetryStyle): void {
    this.currentStyle = style;
  }

  /**
   * Get the current poetry style
   */
  getStyle(): PoetryStyle {
    return this.currentStyle;
  }

  /**
   * Set the AI provider
   */
  async setProvider(provider: AIProvider): Promise<void> {
    this.provider = createAIProvider(provider);
    
    // Verify new provider is available
    const available = await this.provider.isAvailable();
    if (!available) {
      console.warn(`[PoetryGenerator] Provider '${provider}' is not available`);
    }
  }

  /**
   * Get all generated poems
   */
  getGeneratedPoems(): Poem[] {
    return [...this.generatedPoems];
  }

  /**
   * Clear all stored poems
   */
  clearPoems(): void {
    this.generatedPoems = [];
  }

  /**
   * Update the poetry generator configuration
   * Requirements: 1.2, 1.3, 4.3, 5.4, 6.2, 6.3
   */
  updateConfig(config: Partial<PoetryGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If provider, model, or apiKey changed, update the provider instance
    if (config.provider || config.model || config.apiKey) {
      const providerType = this.config.provider;
      
      // Build provider config from updated PoetryGeneratorConfig
      const providerConfig: ProviderConfig = {
        ollama: {
          endpoint: CONFIG.ai.OLLAMA_ENDPOINT,
          model: this.config.model || CONFIG.ai.OLLAMA_MODEL,
        },
        bedrock: {
          region: CONFIG.ai.BEDROCK_REGION,
          modelId: CONFIG.ai.BEDROCK_MODEL_ID,
        },
        openai: {
          apiKey: this.config.apiKey || '',
          model: this.config.model,
        },
      };
      
      this.provider = createAIProvider(providerType as AIProvider, providerConfig);
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): PoetryGeneratorConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build a prompt from audio features using persona-specific template
   */
  private buildAudioPrompt(features: AudioFeatures): string {
    // Get persona and language from config
    const language = getLanguage(this.config.language);
    
    // Get persona-specific template
    const template = getPersonaTemplate(this.config.persona, language.nativeName);
    
    // Use librosa mood if available, otherwise infer from features
    const mood = features.mood || this.inferMood(features);
    
    // Get intensity description (prioritize features.intensity over energy)
    const intensityValue = features.intensity !== undefined ? features.intensity : features.energy;
    const intensityDesc = this.getIntensityDescription(intensityValue);
    
    const pace = this.getPaceDescription(features.tempo);
    const energyDesc = this.getEnergyDescription(features.energy);

    // Build prompt with template and music characteristics
    let prompt = template;
    
    prompt += `\n\nMusic characteristics:
- Tempo: ${features.tempo.toFixed(0)} BPM (${pace})`;

    // Add key if available (from librosa)
    if (features.key) {
      prompt += `\n- Key: ${features.key}`;
    }

    // Emphasize intensity if it differs significantly from energy
    if (features.intensity !== undefined && Math.abs(features.intensity - features.energy) > 0.3) {
      prompt += `\n- Intensity: ${(intensityValue * 100).toFixed(0)}% (${intensityDesc}) - THIS IS THE DOMINANT CHARACTERISTIC`;
      prompt += `\n- Energy level: ${features.energy.toFixed(2)} (${energyDesc})`;
    } else {
      prompt += `\n- Energy/Intensity: ${features.energy.toFixed(2)} (${energyDesc})`;
    }

    // Strongly emphasize the mood from librosa analysis
    prompt += `\n- PRIMARY MOOD: ${mood.toUpperCase()} - This should be the dominant feeling in the poem`;
    prompt += `\n- Emotional tone: ${features.valence > 0.5 ? 'positive' : 'contemplative'}`;

    // Add complexity if available (from librosa)
    if (features.complexity !== undefined) {
      const complexityDesc = features.complexity > 0.7 ? 'complex and layered' :
                            features.complexity > 0.4 ? 'moderately complex' :
                            'simple and direct';
      prompt += `\n- Musical complexity: ${complexityDesc}`;
    }

    // Add length instruction based on style
    const lengthInstruction = this.getLengthInstructionForPrompt();
    
    prompt += `\n\nIMPORTANT REQUIREMENTS:
1. The poem MUST reflect the PRIMARY MOOD (${mood}) and intensity level (${intensityDesc})
2. ${lengthInstruction}
3. Follow the template format strictly
4. Output ONLY the poem in Korean, nothing else (no titles, no explanations)`;

    return prompt;
  }

  /**
   * Build a prompt from mood using persona-specific template
   */
  private buildMoodPrompt(mood: string): string {
    const language = getLanguage(this.config.language);
    
    // Get persona-specific template
    const template = getPersonaTemplate(this.config.persona, language.nativeName);

    return `${template}

Mood to evoke: ${mood}

Follow the template format strictly. Output ONLY the poem, nothing else.`;
  }

  /**
   * Build a prompt from interaction data using persona-specific template
   */
  private buildInteractionPrompt(
    interaction: InteractionData,
    audioFeatures?: AudioFeatures
  ): string {
    const language = getLanguage(this.config.language);
    
    // Get persona-specific template
    const template = getPersonaTemplate(this.config.persona, language.nativeName);
    
    let contextInfo = '';
    if (audioFeatures) {
      const mood = this.inferMood(audioFeatures);
      contextInfo = `\nMusical context: ${mood} mood, ${audioFeatures.tempo.toFixed(0)} BPM`;
    }

    const interactionType = interaction.dragPath.length > 0 ? 'flowing gesture' : 'decisive touch';
    
    return `${template}

User interaction: ${interactionType} on the canvas${contextInfo}

Follow the template format strictly. Output ONLY the poem, nothing else.`;
  }

  /**
   * Get style-specific instructions for the prompt
   */
  private getStyleInstructions(): string {
    const { tone, structure } = this.currentStyle;
    
    let instructions = '';
    
    // Structure instructions
    switch (structure) {
      case 'haiku':
        instructions = 'haiku (5-7-5 syllable pattern)';
        break;
      case 'sonnet':
        instructions = 'sonnet with 14 lines';
        break;
      case 'prose':
        instructions = 'prose poem';
        break;
      case 'free-verse':
      default:
        instructions = 'free-verse poem';
    }
    
    // Add tone
    instructions += ` with a ${tone} tone`;
    
    return instructions;
  }

  /**
   * Get length instruction based on style
   */
  private getLengthInstruction(): string {
    switch (this.currentStyle.length) {
      case 'short':
        return 'Keep it concise (2-4 lines).';
      case 'long':
        return 'Develop the imagery fully (8-12 lines).';
      case 'medium':
      default:
        return 'Use 4-6 lines.';
    }
  }

  /**
   * Get length instruction for prompt (more specific for Korean)
   */
  private getLengthInstructionForPrompt(): string {
    switch (this.currentStyle.length) {
      case 'short':
        return 'Write approximately 150-200 characters in Korean (about 4-6 lines)';
      case 'long':
        return 'Write approximately 450-550 characters in Korean (about 12-16 lines). This should be a substantial poem with rich imagery and depth';
      case 'medium':
      default:
        return 'Write approximately 300-400 characters in Korean (about 8-10 lines)';
    }
  }

  /**
   * Get generation options based on current style
   */
  private getGenerationOptions(): GenerationOptions {
    const baseOptions = getDefaultGenerationOptions();
    
    // Adjust temperature based on tone
    let temperature = baseOptions.temperature;
    if (this.currentStyle.tone === 'dramatic') {
      temperature = 0.9; // More creative
    } else if (this.currentStyle.tone === 'calm') {
      temperature = 0.6; // More focused
    }

    // Adjust max tokens based on length
    // Note: Qwen3 uses thinking mode which consumes tokens, so we need higher limits
    let maxTokens = baseOptions.maxTokens;
    if (this.currentStyle.length === 'short') {
      maxTokens = 300; // Increased for thinking models
    } else if (this.currentStyle.length === 'long') {
      maxTokens = 1500; // Increased for thinking models + ~500 character Korean poems
    } else {
      maxTokens = 800; // Medium length
    }

    return {
      ...baseOptions,
      temperature,
      maxTokens,
    };
  }

  /**
   * Generate with timeout to prevent hanging
   */
  private async generateWithTimeout(
    prompt: string,
    options: GenerationOptions
  ): Promise<string> {
    const timeoutMs = CONFIG.ai.GENERATION_TIMEOUT;
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Generation timeout')), timeoutMs)
    );

    try {
      return await Promise.race([
        this.provider.generate(prompt, options),
        timeoutPromise,
      ]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Store a generated poem
   */
  private storePoem(text: string, features: AudioFeatures): void {
    const poem: Poem = {
      id: this.generatePoemId(),
      text,
      timestamp: Date.now(),
      audioFeatures: features,
      style: this.currentStyle,
      source: this.provider.getCurrentProvider(),
    };

    this.generatedPoems.push(poem);

    // Limit stored poems
    if (this.generatedPoems.length > CONFIG.poetry.MAX_POEMS_STORED) {
      this.generatedPoems.shift();
    }
  }

  /**
   * Generate a unique poem ID
   */
  private generatePoemId(): string {
    return `poem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Infer mood from audio features
   * Considers intensity, energy, valence, and tempo
   */
  private inferMood(features: AudioFeatures): string {
    const { energy, valence, tempo, intensity } = features;
    
    // Use intensity if available, otherwise fall back to energy
    const powerLevel = intensity !== undefined ? intensity : energy;

    // High intensity/power scenarios
    if (powerLevel > 0.7) {
      if (valence > 0.6) {
        return 'joyful and energetic';
      } else if (valence < 0.4) {
        return 'intense and dramatic';
      } else {
        return 'powerful and driving';
      }
    }
    
    // Low intensity/power scenarios
    if (powerLevel < 0.3) {
      if (valence < 0.4) {
        return 'melancholic and contemplative';
      } else if (valence > 0.6) {
        return 'calm and peaceful';
      } else {
        return 'gentle and introspective';
      }
    }
    
    // Tempo-based moods for moderate intensity
    if (tempo > 140) {
      return 'fast-paced and exciting';
    } else if (tempo < 80) {
      return 'slow and reflective';
    }
    
    // Default moderate mood
    return 'balanced and flowing';
  }

  /**
   * Get intensity description from intensity/energy level
   * Used for overall musical intensity (how powerful/forceful the music feels)
   */
  private getIntensityDescription(intensity: number): string {
    if (intensity > 0.8) return 'very intense and powerful';
    if (intensity > 0.6) return 'strong and forceful';
    if (intensity > 0.4) return 'moderate intensity';
    if (intensity > 0.2) return 'gentle and subdued';
    return 'very soft and delicate';
  }

  /**
   * Get energy description from energy level
   * Used for musical energy (how active/dynamic the music is)
   */
  private getEnergyDescription(energy: number): string {
    if (energy > 0.8) return 'highly energetic and dynamic';
    if (energy > 0.6) return 'energetic and lively';
    if (energy > 0.4) return 'moderately active';
    if (energy > 0.2) return 'calm and steady';
    return 'very calm and still';
  }

  /**
   * Get pace description from tempo
   */
  private getPaceDescription(tempo: number): string {
    if (tempo > 160) return 'very fast';
    if (tempo > 120) return 'fast';
    if (tempo > 90) return 'moderate';
    if (tempo > 60) return 'slow';
    return 'very slow';
  }

  /**
   * Get default poetry style
   */
  private getDefaultStyle(): PoetryStyle {
    return {
      tone: 'calm',
      length: 'long', // Changed to long for ~500 character poems
      structure: 'free-verse',
    };
  }

  /**
   * Get default poetry generator configuration
   */
  private getDefaultConfig(): PoetryGeneratorConfig {
    return {
      persona: 'hamlet',
      language: 'ko',
      provider: 'ollama',
      model: 'gemma3:4b',
    };
  }

  /**
   * Generate poetry from template (fallback)
   */
  private generateFromTemplate(features: AudioFeatures): string {
    const poetry = this.fallbackProvider.generateFromAudioFeatures(features, this.currentStyle);
    
    // Store the template-generated poem
    this.storePoem(poetry, features);
    
    return poetry;
  }

  /**
   * Get template poetry for a given mood
   */
  private getTemplateForMood(mood: string): string {
    return this.fallbackProvider.generateFromMood(mood, this.currentStyle);
  }
}
