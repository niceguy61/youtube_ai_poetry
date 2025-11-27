/**
 * VisualizationConfigGenerator - AI-powered visualization parameter generation
 * 
 * Uses AI to generate dynamic visualization parameters based on librosa audio analysis.
 * The AI interprets musical characteristics and suggests appropriate visual settings.
 */

import { OllamaProvider } from './OllamaProvider';
import { CONFIG } from '../config/config';

export interface VisualizationConfig {
  gradient: {
    colors: [string, string];
    speed: number; // 0.5-2.0, BPM multiplier
  };
  equalizer: {
    barCount: number; // 32-128
    colors: string[]; // 2-3 colors for gradient
    smoothing: number; // 0.5-0.9
  };
  spotlight: {
    count: number; // 3-8
    colors: string[]; // 2-4 colors
    speed: number; // 0.5-2.0
    radius: [number, number]; // [min, max] 30-150
  };
}

interface LibrosaAnalysis {
  tempo: number;
  key: string;
  energy: number;
  valence: number;
  spectral_centroid: number;
  spectral_rolloff: number;
  zero_crossing_rate: number;
  mfcc_mean: number[];
  mood: string;
  intensity: string;
  complexity: string;
}

export class VisualizationConfigGenerator {
  private aiProvider: OllamaProvider | null = null;

  constructor() {
    this.initializeAI();
  }

  private async initializeAI(): Promise<void> {
    try {
      this.aiProvider = new OllamaProvider({
        ollama: {
          endpoint: CONFIG.ai.OLLAMA_ENDPOINT,
          model: CONFIG.ai.OLLAMA_MODEL,
        },
      });
      
      const available = await this.aiProvider.isAvailable();
      if (!available) {
        console.warn('[VisualizationConfigGenerator] Ollama not available, will use fallback');
        this.aiProvider = null;
      }
    } catch (error) {
      console.error('[VisualizationConfigGenerator] Failed to initialize AI:', error);
      this.aiProvider = null;
    }
  }

  /**
   * Generate visualization configuration from librosa analysis
   */
  async generateConfig(analysis: LibrosaAnalysis): Promise<VisualizationConfig> {
    if (!this.aiProvider) {
      console.warn('[VisualizationConfigGenerator] AI provider not available, using fallback');
      return this.getFallbackConfig(analysis);
    }

    try {
      const prompt = this.buildPrompt(analysis);
      const response = await this.aiProvider.generate(prompt, {
        temperature: 0.3, // Lower temperature for more consistent JSON output
        maxTokens: 800, // Increased for thinking models
        topP: 0.9,
      });

      // Check for empty response
      if (!response || response.trim() === '') {
        console.warn('[VisualizationConfigGenerator] Empty response from AI, using fallback');
        return this.getFallbackConfig(analysis);
      }

      const config = this.parseAIResponse(response);
      return config;
    } catch (error) {
      console.error('[VisualizationConfigGenerator] AI generation failed:', error);
      return this.getFallbackConfig(analysis);
    }
  }

  private buildPrompt(analysis: LibrosaAnalysis): string {
    return `You are a visualization designer. Based on the following music analysis, generate visualization parameters.

Music Analysis:
- Tempo: ${analysis.tempo} BPM
- Key: ${analysis.key}
- Energy: ${analysis.energy.toFixed(2)} (0-1 scale)
- Valence (positivity): ${analysis.valence.toFixed(2)} (0-1 scale)
- PRIMARY MOOD: ${analysis.mood.toUpperCase()}
- Intensity: ${analysis.intensity}
- Complexity: ${analysis.complexity}
- Spectral Centroid: ${analysis.spectral_centroid.toFixed(2)} (brightness)
- Zero Crossing Rate: ${analysis.zero_crossing_rate.toFixed(4)} (percussiveness)

CRITICAL: Generate visualization parameters in this EXACT JSON format. Output ONLY valid JSON, no additional text, no thinking, no explanation:

{
  "gradient": {
    "colors": ["#RRGGBB", "#RRGGBB"],
    "speed": 1.0
  },
  "equalizer": {
    "barCount": 64,
    "colors": ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
    "smoothing": 0.7
  },
  "spotlight": {
    "count": 5,
    "colors": ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
    "speed": 1.0,
    "radius": [40, 80]
  }
}

Guidelines (reflect PRIMARY MOOD):
- High energy → vibrant colors (red, orange, yellow), faster speed, more spotlights
- Low energy → cool colors (blue, purple, green), slower speed, fewer spotlights
- High valence (happy) → warm, bright colors
- Low valence (sad) → cool, dark colors
- High tempo → faster speed (1.5-2.0), more bars (96-128)
- Low tempo → slower speed (0.5-0.8), fewer bars (32-48)
- High complexity → more spotlights (6-8), varied colors
- Low complexity → fewer spotlights (3-4), similar colors

IMPORTANT: Return ONLY the complete JSON object above. No thinking process, no explanation, just the JSON.`;
  }

  private parseAIResponse(response: string): VisualizationConfig {
    try {
      // Extract JSON from response (AI might add extra text or thinking process)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[VisualizationConfigGenerator] No JSON found in response:', response.substring(0, 100));
        throw new Error('No JSON found in response');
      }

      const config = JSON.parse(jsonMatch[0]);
      
      // Validate required fields exist
      if (!config.gradient || !config.equalizer || !config.spotlight) {
        console.warn('[VisualizationConfigGenerator] Incomplete config from AI:', config);
        throw new Error('Incomplete configuration');
      }
      
      // Validate and sanitize
      return {
        gradient: {
          colors: this.validateColors(config.gradient?.colors, 2) as [string, string],
          speed: this.clamp(config.gradient?.speed ?? 1.0, 0.5, 2.0),
        },
        equalizer: {
          barCount: Math.round(this.clamp(config.equalizer?.barCount ?? 64, 32, 128)),
          colors: this.validateColors(config.equalizer?.colors, 3),
          smoothing: this.clamp(config.equalizer?.smoothing ?? 0.7, 0.5, 0.9),
        },
        spotlight: {
          count: Math.round(this.clamp(config.spotlight?.count ?? 5, 3, 8)),
          colors: this.validateColors(config.spotlight?.colors, 3),
          speed: this.clamp(config.spotlight?.speed ?? 1.0, 0.5, 2.0),
          radius: [
            Math.round(this.clamp(config.spotlight?.radius?.[0] ?? 40, 30, 100)),
            Math.round(this.clamp(config.spotlight?.radius?.[1] ?? 80, 50, 150)),
          ],
        },
      };
    } catch (error) {
      console.error('[VisualizationConfigGenerator] Failed to parse AI response:', error);
      console.error('[VisualizationConfigGenerator] Response was:', response.substring(0, 200));
      throw error;
    }
  }

  private getFallbackConfig(analysis: LibrosaAnalysis): VisualizationConfig {
    // Rule-based fallback based on analysis
    const isHighEnergy = analysis.energy > 0.6;
    const isHighValence = analysis.valence > 0.6;
    const isHighTempo = analysis.tempo > 120;

    // Color selection based on mood
    let colors: string[];
    if (isHighEnergy && isHighValence) {
      colors = ['#FF6B6B', '#FFD93D', '#FF8C42']; // Warm, energetic
    } else if (isHighEnergy && !isHighValence) {
      colors = ['#C06C84', '#6C5B7B', '#FF6B6B']; // Intense, dramatic
    } else if (!isHighEnergy && isHighValence) {
      colors = ['#4ECDC4', '#A8DADC', '#6BCF7F']; // Calm, positive
    } else {
      colors = ['#457B9D', '#6C5B7B', '#A8DADC']; // Melancholic
    }

    return {
      gradient: {
        colors: [colors[0], colors[1]],
        speed: isHighTempo ? 1.5 : 0.8,
      },
      equalizer: {
        barCount: isHighTempo ? 96 : 48,
        colors: colors,
        smoothing: isHighEnergy ? 0.6 : 0.8,
      },
      spotlight: {
        count: isHighEnergy ? 7 : 4,
        colors: colors,
        speed: isHighTempo ? 1.5 : 0.8,
        radius: isHighEnergy ? [50, 100] : [40, 70],
      },
    };
  }

  private validateColors(colors: any, count: number): string[] {
    if (!Array.isArray(colors) || colors.length < count) {
      // Return default colors
      return ['#FF6B6B', '#4ECDC4', '#FFD93D'].slice(0, count);
    }

    return colors.slice(0, count).map(c => {
      if (typeof c === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c)) {
        return c;
      }
      return '#FF6B6B'; // Default fallback
    });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
