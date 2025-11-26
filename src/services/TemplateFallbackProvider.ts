/**
 * Template Fallback Provider - Provides template-based poetry when AI services are unavailable
 * Organizes poetry templates by mood and selects appropriate templates based on audio features
 */

import type { AudioFeatures } from '../types/audio';
import type { PoetryStyle } from '../types/poetry';

/**
 * Poetry template organized by mood category
 */
interface PoetryTemplate {
  mood: string;
  templates: string[];
}

/**
 * Template Fallback Provider class
 * Provides pre-written poetry templates as fallback when AI generation fails
 */
export class TemplateFallbackProvider {
  private templates: PoetryTemplate[];

  constructor() {
    this.templates = this.initializeTemplates();
  }

  /**
   * Generate poetry from audio features using templates
   */
  generateFromAudioFeatures(features: AudioFeatures, style?: PoetryStyle): string {
    const mood = this.inferMood(features);
    return this.selectTemplate(mood, style);
  }

  /**
   * Generate poetry from mood descriptor using templates
   */
  generateFromMood(mood: string, style?: PoetryStyle): string {
    return this.selectTemplate(mood, style);
  }

  /**
   * Get all available mood categories
   */
  getAvailableMoods(): string[] {
    return this.templates.map(t => t.mood);
  }

  /**
   * Get templates for a specific mood
   */
  getTemplatesForMood(mood: string): string[] {
    const template = this.templates.find(t => t.mood === mood);
    return template ? [...template.templates] : [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Initialize the poetry template library
   */
  private initializeTemplates(): PoetryTemplate[] {
    return [
      {
        mood: 'joyful',
        templates: [
          'Pulsing rhythms drive the night,\nBeats that set the soul alight.\nEnergy flows through every vein,\nJoy and music, one refrain.',
          'Dancing lights and soaring sound,\nWhere happiness and rhythm are found.\nEvery note a burst of cheer,\nMusic makes the moment clear.',
          'Laughter echoes in the air,\nMelodies beyond compare.\nJoyful hearts in perfect time,\nLife and music, both sublime.',
          'Bright and bold, the music plays,\nSunshine fills our dancing days.\nEvery beat a celebration,\nPure and perfect elation.',
        ],
      },
      {
        mood: 'energetic',
        templates: [
          'Thunder rolls through electric veins,\nPower surges, nothing restrains.\nDramatic waves crash and collide,\nIn this storm, we cannot hide.',
          'Fierce and bold, the music roars,\nShaking walls and opening doors.\nIntensity in every beat,\nWhere passion and power meet.',
          'Lightning strikes with every note,\nOn waves of energy we float.\nUnstoppable and wild and free,\nThis is where we are meant to be.',
          'Racing forward, never slow,\nRapid rhythms ebb and flow.\nExcitement builds with every beat,\nWhere speed and melody meet.',
        ],
      },
      {
        mood: 'melancholic',
        templates: [
          'Soft whispers in the fading light,\nMemories drift through endless night.\nGentle sorrow, bittersweet,\nWhere silence and sound meet.',
          'Shadows dance on walls of time,\nEchoes of a distant chime.\nQuiet thoughts in minor key,\nReflections of what used to be.',
          'Tears fall like autumn rain,\nMusic soothes the aching pain.\nIn the sadness, beauty grows,\nWhere the deepest feeling flows.',
          'Lonely notes drift through the air,\nCarrying weight of tender care.\nMelancholy\'s gentle embrace,\nFinds its home in this quiet space.',
        ],
      },
      {
        mood: 'calm',
        templates: [
          'Gentle waves upon the shore,\nPeaceful moments, nothing more.\nSoft whispers in the breeze,\nQuiet thoughts that bring us ease.',
          'Stillness settles like the dew,\nCalm horizons, skies of blue.\nSerenity in every note,\nOn tranquil seas, we gently float.',
          'Peaceful rhythms, soft and slow,\nWhere the gentle waters flow.\nIn the quiet, we find rest,\nMusic\'s calm, a gentle guest.',
          'Silence speaks in subtle ways,\nThrough the music\'s gentle haze.\nCalm and centered, here we stay,\nIn this peaceful, perfect day.',
        ],
      },
      {
        mood: 'dramatic',
        templates: [
          'Epic tales in sound unfold,\nStories brave and legends bold.\nDramatic swells that rise and fall,\nMusic\'s power conquers all.',
          'Tension builds with every phrase,\nThrough the music\'s complex maze.\nDramatic heights and depths profound,\nIn these notes, we are unbound.',
          'Crescendos shake the very ground,\nWhere dramatic force is found.\nEvery note a declaration,\nOf music\'s grand narration.',
          'Bold and fierce, the music cries,\nReaching toward the endless skies.\nDramatic passion, unrestrained,\nIn every note, emotions chained.',
        ],
      },
      {
        mood: 'contemplative',
        templates: [
          'Time moves slowly, note by note,\nOn contemplation, we float.\nReflective moments, deep and true,\nIn the music, we renew.',
          'Measured steps through quiet space,\nThoughtful rhythm, gentle pace.\nIn the slowness, wisdom grows,\nWhere the deepest feeling flows.',
          'Questions linger in the air,\nAnswers found in music\'s care.\nContemplative and serene,\nIn between what\'s heard and seen.',
          'Pondering the mysteries,\nThrough these gentle melodies.\nThoughtful music, soft and wise,\nTruth reflected in our eyes.',
        ],
      },
      {
        mood: 'mysterious',
        templates: [
          'Shadows whisper secrets old,\nMysteries in notes unfold.\nHidden meanings, veiled and deep,\nIn the music\'s mystic keep.',
          'Enigmatic melodies,\nDancing through the mysteries.\nWhat is hidden, what is shown,\nIn these sounds, the unknown.',
          'Cryptic rhythms, strange and new,\nMystery in every hue.\nMusic speaks in riddles here,\nDrawing wonder ever near.',
          'Ancient echoes, modern sound,\nWhere the mysterious is found.\nIn the music\'s secret heart,\nMystery and music, never part.',
        ],
      },
      {
        mood: 'uplifting',
        templates: [
          'Rising up on wings of sound,\nWhere hope and music are found.\nUplifting spirits, hearts take flight,\nGuided by the music\'s light.',
          'Every note lifts us higher,\nFueling hope\'s eternal fire.\nUpward, onward, toward the sun,\nMusic and spirit become one.',
          'Soaring melodies inspire,\nLifting hearts from earthly mire.\nIn the music, we ascend,\nToward horizons without end.',
          'Hope resounds in every chord,\nUplifting like a sacred word.\nMusic raises, music heals,\nShowing us what spirit feels.',
        ],
      },
    ];
  }

  /**
   * Select an appropriate template based on mood and style
   */
  private selectTemplate(mood: string, style?: PoetryStyle): string {
    // Find exact mood match
    let template = this.templates.find(t => t.mood === mood);

    // If no exact match, try to find a close match
    if (!template) {
      template = this.findClosestMood(mood);
    }

    // Fallback to calm if nothing matches
    if (!template) {
      template = this.templates.find(t => t.mood === 'calm');
    }

    // This should never happen, but just in case
    if (!template || template.templates.length === 0) {
      return 'Music flows through time and space,\nFinding beauty, finding grace.';
    }

    // Select a random template from the mood category
    const randomIndex = Math.floor(Math.random() * template.templates.length);
    let selectedTemplate = template.templates[randomIndex];

    // Adjust template based on style if provided
    if (style) {
      selectedTemplate = this.adjustTemplateForStyle(selectedTemplate, style);
    }

    return selectedTemplate;
  }

  /**
   * Find the closest matching mood from available templates
   */
  private findClosestMood(targetMood: string): PoetryTemplate | undefined {
    const moodLower = targetMood.toLowerCase();

    // Check for partial matches
    for (const template of this.templates) {
      if (moodLower.includes(template.mood) || template.mood.includes(moodLower)) {
        return template;
      }
    }

    // Check for keyword matches
    const moodKeywords: Record<string, string[]> = {
      joyful: ['happy', 'joy', 'cheerful', 'bright', 'positive'],
      energetic: ['intense', 'powerful', 'strong', 'fast', 'exciting'],
      melancholic: ['sad', 'sorrow', 'blue', 'lonely', 'wistful'],
      calm: ['peaceful', 'tranquil', 'serene', 'gentle', 'quiet'],
      dramatic: ['epic', 'grand', 'bold', 'theatrical'],
      contemplative: ['thoughtful', 'reflective', 'meditative', 'pensive'],
      mysterious: ['enigmatic', 'cryptic', 'hidden', 'secret'],
      uplifting: ['inspiring', 'hopeful', 'encouraging', 'positive'],
    };

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => moodLower.includes(keyword))) {
        return this.templates.find(t => t.mood === mood);
      }
    }

    return undefined;
  }

  /**
   * Adjust template based on poetry style preferences
   */
  private adjustTemplateForStyle(template: string, style: PoetryStyle): string {
    let adjusted = template;

    // Adjust length
    const lines = template.split('\n');
    if (style.length === 'short' && lines.length > 4) {
      // Take first 2-3 lines for short
      adjusted = lines.slice(0, Math.min(3, lines.length)).join('\n');
    } else if (style.length === 'long' && lines.length < 6) {
      // For long, we can't really extend templates, so just return as is
      // In a real implementation, we might combine multiple templates
      adjusted = template;
    }

    // Note: Structure adjustments (haiku, sonnet) would require more complex
    // template transformations or separate template sets, which is beyond
    // the scope of this fallback system. The templates are designed as
    // free-verse which works for most cases.

    return adjusted;
  }

  /**
   * Infer mood from audio features
   */
  private inferMood(features: AudioFeatures): string {
    const { energy, valence, tempo } = features;

    // High energy, high valence = joyful
    if (energy > 0.7 && valence > 0.6) {
      return 'joyful';
    }

    // High energy, low valence = energetic/dramatic
    if (energy > 0.7 && valence < 0.4) {
      return 'dramatic';
    }

    // Low energy, low valence = melancholic
    if (energy < 0.3 && valence < 0.4) {
      return 'melancholic';
    }

    // Low energy, high valence = calm
    if (energy < 0.3 && valence > 0.6) {
      return 'calm';
    }

    // Medium energy, medium valence = contemplative
    if (energy > 0.3 && energy < 0.7 && valence > 0.4 && valence < 0.6) {
      return 'contemplative';
    }

    // Very fast tempo = energetic
    if (tempo > 140) {
      return 'energetic';
    }

    // Very slow tempo = contemplative
    if (tempo < 80) {
      return 'contemplative';
    }

    // Medium characteristics with slight mystery
    if (energy > 0.4 && energy < 0.6 && valence < 0.5) {
      return 'mysterious';
    }

    // Positive but not too energetic = uplifting
    if (valence > 0.6 && energy > 0.4 && energy < 0.7) {
      return 'uplifting';
    }

    // Default to calm
    return 'calm';
  }
}
