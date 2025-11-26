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
} from '../types/poetry';
import { AIProviderService } from './AIProviderService';
import { createAIProvider, getDefaultGenerationOptions } from './AIProviderFactory';
import { TemplateFallbackProvider } from './TemplateFallbackProvider';
import { CONFIG } from '../config/config';

/**
 * Poetry Generator class
 * Generates poetry using AI based on audio features, mood, and user interactions
 */
export class PoetryGenerator {
  private provider: AIProviderService;
  private fallbackProvider: TemplateFallbackProvider;
  private currentStyle: PoetryStyle;
  private generatedPoems: Poem[] = [];

  constructor(provider?: AIProvider) {
    this.provider = createAIProvider(provider);
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

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build a prompt from audio features
   */
  private buildAudioPrompt(features: AudioFeatures): string {
    // Use librosa mood if available, otherwise infer from features
    const mood = features.mood || this.inferMood(features);
    const intensity = features.intensity !== undefined 
      ? this.getIntensityDescription(features.intensity)
      : this.getIntensityDescription(features.energy);
    const pace = this.getPaceDescription(features.tempo);

    // Build enhanced prompt with librosa analysis in Korean with Hamlet persona
    let prompt = `당신은 셰익스피어의 햄릿입니다. 이 음악을 듣고 깊은 사색에 잠겨 시를 짓습니다.

음악의 특징:
- 템포: ${features.tempo.toFixed(0)} BPM (${pace})`;

    // Add key if available (from librosa)
    if (features.key) {
      prompt += `\n- 음악 키: ${features.key}`;
    }

    prompt += `\n- 에너지: ${features.energy.toFixed(2)} (${intensity})
- 분위기: ${mood}
- 감정 톤: ${features.valence > 0.5 ? '긍정적' : '사색적'}`;

    // Add complexity if available (from librosa)
    if (features.complexity !== undefined) {
      const complexityDesc = features.complexity > 0.7 ? '복잡하고 다층적' :
                            features.complexity > 0.4 ? '적당히 복잡함' :
                            '단순하고 직접적';
      prompt += `\n- 음악 복잡도: ${complexityDesc}`;
    }

    prompt += `\n\n햄릿의 관점에서 이 음악이 불러일으키는 실존적 고뇌, 삶과 죽음에 대한 성찰, 그리고 인간 존재의 의미를 담아 한글로 약 500자 분량의 시를 지어주세요.
"존재할 것인가, 존재하지 않을 것인가"의 철학적 깊이를 담되, 이 음악의 특성을 반영하세요.
감각적 이미지와 감정적 울림에 집중하고, 충분한 길이로 깊이 있게 표현하세요.`;

    return prompt;
  }

  /**
   * Build a prompt from mood
   */
  private buildMoodPrompt(mood: string): string {
    const styleInstructions = this.getStyleInstructions();

    return `Generate a ${styleInstructions} that evokes a ${mood} mood.

Create vivid imagery and emotional depth.
${this.getLengthInstruction()}
Let the words flow naturally with the feeling.`;
  }

  /**
   * Build a prompt from interaction data
   */
  private buildInteractionPrompt(
    interaction: InteractionData,
    audioFeatures?: AudioFeatures
  ): string {
    const styleInstructions = this.getStyleInstructions();
    
    let contextInfo = '';
    if (audioFeatures) {
      const mood = this.inferMood(audioFeatures);
      contextInfo = `\nMusical context: ${mood} mood, ${audioFeatures.tempo.toFixed(0)} BPM`;
    }

    const interactionType = interaction.dragPath.length > 0 ? 'flowing gesture' : 'decisive touch';
    
    return `Generate a ${styleInstructions} inspired by a user's ${interactionType} on the canvas.${contextInfo}

The interaction suggests movement and intention.
${this.getLengthInstruction()}
Capture the feeling of creative expression and connection.`;
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

    // Adjust max tokens based on length (increased for 500 character poems)
    let maxTokens = baseOptions.maxTokens;
    if (this.currentStyle.length === 'short') {
      maxTokens = 150;
    } else if (this.currentStyle.length === 'long') {
      maxTokens = 800; // Increased for ~500 character Korean poems
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
   */
  private inferMood(features: AudioFeatures): string {
    const { energy, valence, tempo } = features;

    if (energy > 0.7 && valence > 0.6) {
      return 'joyful and energetic';
    } else if (energy > 0.7 && valence < 0.4) {
      return 'intense and dramatic';
    } else if (energy < 0.3 && valence < 0.4) {
      return 'melancholic and contemplative';
    } else if (energy < 0.3 && valence > 0.6) {
      return 'calm and peaceful';
    } else if (tempo > 140) {
      return 'fast-paced and exciting';
    } else if (tempo < 80) {
      return 'slow and reflective';
    } else {
      return 'balanced and flowing';
    }
  }

  /**
   * Get intensity description from energy level
   */
  private getIntensityDescription(energy: number): string {
    if (energy > 0.8) return 'very intense';
    if (energy > 0.6) return 'energetic';
    if (energy > 0.4) return 'moderate';
    if (energy > 0.2) return 'gentle';
    return 'very soft';
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
