/**
 * StorytellingManager - Provides narrative context and guides user experience
 * 
 * This component manages the storytelling elements throughout the application,
 * providing contextual messages, transitions, and guidance to create an
 * immersive narrative experience.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import type { VisualizationMode } from '../types/visualization';

export type AnalysisStage = 
  | 'loading'
  | 'validating'
  | 'analyzing'
  | 'generating'
  | 'ready';

export type NarrativeStyle = 
  | 'minimal'
  | 'descriptive'
  | 'poetic'
  | 'technical';

export interface ExperienceSummary {
  duration: number;
  poemsGenerated: number;
  interactionsCount: number;
  visualizationMode: VisualizationMode;
  highlights: string[];
}

export interface StorytellingMessage {
  type: 'introduction' | 'analysis' | 'transition' | 'guidance' | 'summary';
  content: string;
  timestamp: number;
}

export class StorytellingManager {
  private narrativeStyle: NarrativeStyle = 'descriptive';
  private messageCallbacks: ((message: StorytellingMessage) => void)[] = [];

  /**
   * Set the narrative style for storytelling messages
   */
  setNarrativeStyle(style: NarrativeStyle): void {
    this.narrativeStyle = style;
  }

  /**
   * Get the current narrative style
   */
  getNarrativeStyle(): NarrativeStyle {
    return this.narrativeStyle;
  }

  /**
   * Subscribe to storytelling messages
   */
  onMessage(callback: (message: StorytellingMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit a storytelling message to all subscribers
   */
  private emitMessage(message: StorytellingMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  /**
   * Show introduction narrative when the application loads
   * Requirement 7.1: Present introductory narrative explaining the experience
   */
  showIntroduction(): void {
    const content = this.getIntroductionContent();
    this.emitMessage({
      type: 'introduction',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Show analysis message for different processing stages
   * Requirement 7.2: Display contextual messages during audio analysis
   */
  showAnalysisMessage(stage: AnalysisStage): void {
    const content = this.getAnalysisContent(stage);
    this.emitMessage({
      type: 'analysis',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Show transition between different states or modes
   * Requirement 7.3: Show transitional animations connecting visual and textual elements
   */
  showTransition(from: string, to: string): void {
    const content = this.getTransitionContent(from, to);
    this.emitMessage({
      type: 'transition',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Show guidance hint to encourage user exploration
   * Requirement 7.4: Provide subtle guidance hints during interaction
   */
  showGuidanceHint(hint: string): void {
    const content = this.getGuidanceContent(hint);
    this.emitMessage({
      type: 'guidance',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Show summary of the experience
   * Requirement 7.5: Offer summary view showcasing generated poetry and key moments
   */
  showSummary(data: ExperienceSummary): void {
    const content = this.getSummaryContent(data);
    this.emitMessage({
      type: 'summary',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Generate introduction content based on narrative style
   */
  private getIntroductionContent(): string {
    switch (this.narrativeStyle) {
      case 'minimal':
        return 'Welcome. Upload music to begin.';
      
      case 'descriptive':
        return 'Welcome to Music Poetry Canvas. Upload your music, and watch as it transforms into a living canvas of sound, color, and poetry. Your journey into synesthetic art begins now.';
      
      case 'poetic':
        return 'Where sound becomes sight, and rhythm births verse. Welcome, traveler, to a realm where music paints the canvas and poetry dances with light. Let your journey begin.';
      
      case 'technical':
        return 'Music Poetry Canvas: An interactive audio-visual experience. Upload audio (MP3/OGG, max 5 minutes) to begin real-time analysis, visualization, and AI-powered poetry generation.';
      
      default:
        return 'Welcome to Music Poetry Canvas.';
    }
  }

  /**
   * Generate analysis stage content based on narrative style
   */
  private getAnalysisContent(stage: AnalysisStage): string {
    const messages: Record<NarrativeStyle, Record<AnalysisStage, string>> = {
      minimal: {
        loading: 'Loading...',
        validating: 'Validating...',
        analyzing: 'Analyzing...',
        generating: 'Generating...',
        ready: 'Ready.'
      },
      descriptive: {
        loading: 'Loading your music...',
        validating: 'Validating audio format and duration...',
        analyzing: 'Analyzing the musical landscape—detecting rhythms, harmonies, and emotional textures...',
        generating: 'Weaving poetry from the threads of sound...',
        ready: 'Your experience is ready. Let the music guide you.'
      },
      poetic: {
        loading: 'The music awakens...',
        validating: 'Listening to the whispers of your melody...',
        analyzing: 'Diving deep into the soul of sound, where frequencies dance and emotions bloom...',
        generating: 'The muse speaks, translating rhythm into verse...',
        ready: 'The canvas awaits your touch.'
      },
      technical: {
        loading: 'Loading audio buffer...',
        validating: 'Validating: format, duration, sample rate...',
        analyzing: 'Extracting features: BPM, spectral centroid, MFCC, energy levels...',
        generating: 'AI poetry generation in progress...',
        ready: 'System ready. All components initialized.'
      }
    };

    return messages[this.narrativeStyle][stage];
  }

  /**
   * Generate transition content based on narrative style
   */
  private getTransitionContent(from: string, to: string): string {
    switch (this.narrativeStyle) {
      case 'minimal':
        return `${from} → ${to}`;
      
      case 'descriptive':
        return `Transitioning from ${from} to ${to}...`;
      
      case 'poetic':
        return `As ${from} fades, ${to} emerges from the mist...`;
      
      case 'technical':
        return `State transition: ${from} → ${to}`;
      
      default:
        return `Moving to ${to}`;
    }
  }

  /**
   * Generate guidance content based on narrative style
   */
  private getGuidanceContent(hint: string): string {
    switch (this.narrativeStyle) {
      case 'minimal':
        return hint;
      
      case 'descriptive':
        return `Tip: ${hint}`;
      
      case 'poetic':
        return `A whisper from the canvas: ${hint}`;
      
      case 'technical':
        return `[GUIDANCE] ${hint}`;
      
      default:
        return hint;
    }
  }

  /**
   * Generate summary content based on narrative style
   */
  private getSummaryContent(data: ExperienceSummary): string {
    const minutes = Math.floor(data.duration / 60);
    const seconds = Math.floor(data.duration % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    switch (this.narrativeStyle) {
      case 'minimal':
        return `Duration: ${timeStr} | Poems: ${data.poemsGenerated} | Interactions: ${data.interactionsCount}`;
      
      case 'descriptive':
        return `Your journey through ${timeStr} of music has created ${data.poemsGenerated} unique poems through ${data.interactionsCount} interactions. The ${data.visualizationMode} visualization brought your experience to life.${data.highlights.length > 0 ? '\n\nHighlights:\n' + data.highlights.map(h => `• ${h}`).join('\n') : ''}`;
      
      case 'poetic':
        return `In ${timeStr}, the music spoke ${data.poemsGenerated} times, each verse a reflection of sound made visible. Through ${data.interactionsCount} touches, you shaped the canvas, painting with ${data.visualizationMode} light.${data.highlights.length > 0 ? '\n\nMoments to remember:\n' + data.highlights.map(h => `✦ ${h}`).join('\n') : ''}`;
      
      case 'technical':
        return `EXPERIENCE SUMMARY\nDuration: ${timeStr}\nPoems Generated: ${data.poemsGenerated}\nUser Interactions: ${data.interactionsCount}\nVisualization Mode: ${data.visualizationMode}\nHighlights: ${data.highlights.length}${data.highlights.length > 0 ? '\n' + data.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n') : ''}`;
      
      default:
        return `Experience complete: ${timeStr}, ${data.poemsGenerated} poems, ${data.interactionsCount} interactions.`;
    }
  }
}
