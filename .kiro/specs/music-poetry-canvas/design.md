# Design Document

## Overview

The Music Poetry Canvas is a web-based application that creates an immersive, multi-sensory experience by combining real-time music visualization, AI-generated poetry, and interactive canvas elements. The system is built using modern web technologies with a focus on modularity, performance, and extensibility.

The application follows a layered architecture with clear separation between audio processing, visualization rendering, AI integration, and user interaction. This design enables independent development and testing of components while maintaining a cohesive user experience.

Key design principles:
- **Modularity**: Each component (audio analysis, visualization, poetry generation, canvas interaction) operates independently
- **Performance**: Real-time audio processing and rendering without blocking the main thread
- **Flexibility**: Support for multiple audio sources, visualization modes, and AI providers
- **Extensibility**: Easy to add new visualization effects, AI models, or interaction patterns
- **Developer Experience**: Comprehensive Kiro integration with steering documents and agent hooks

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Audio Input  │  │ Visualization│  │   Poetry     │      │
│  │   Controls   │  │   Canvas     │  │   Display    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Application Core Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Audio      │  │Visualization │  │   Poetry     │      │
│  │   Manager    │  │   Engine     │  │  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Canvas     │  │  Storytelling│  │    Export    │      │
│  │  Controller  │  │   Manager    │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Audio      │  │   Duration   │  │  AI Provider │      │
│  │   Analyzer   │  │  Validator   │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   YouTube    │  │   URL Audio  │                        │
│  │   Extractor  │  │   Fetcher    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Input → Audio Manager → Duration Validator
                ↓
         Audio Analyzer (Web Audio API)
                ↓
         ┌──────┴──────┐
         ↓             ↓
  Visualization    Poetry Generator
     Engine       (Ollama/Bedrock)
         ↓             ↓
    Canvas        Poetry Display
   Controller          ↓
         ↓        Storytelling
    Interactive      Manager
     Canvas            ↓
         └──────┬──────┘
                ↓
          Export Manager
```

## Components and Interfaces

### 1. Audio Manager

**Responsibility**: Manages audio source loading, playback control, and coordination with other components.

**Interface**:
```typescript
interface AudioManager {
  // Load audio from different sources
  loadFromFile(file: File): Promise<AudioSource>;
  loadFromURL(url: string): Promise<AudioSource>;
  loadFromYouTube(url: string): Promise<AudioSource>;
  
  // Playback controls
  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  
  // State queries
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  
  // Event subscriptions
  onPlaybackStateChange(callback: (state: PlaybackState) => void): void;
  onTimeUpdate(callback: (time: number) => void): void;
}

interface AudioSource {
  buffer: AudioBuffer;
  duration: number;
  metadata: AudioMetadata;
}

interface AudioMetadata {
  title?: string;
  artist?: string;
  sourceType: 'file' | 'url' | 'youtube';
}
```

### 2. Duration Validator

**Responsibility**: Validates audio duration before processing to enforce the 5-minute limit.

**Interface**:
```typescript
interface DurationValidator {
  validate(duration: number): ValidationResult;
  getMaxDuration(): number; // Returns 300 seconds (5 minutes)
}

interface ValidationResult {
  isValid: boolean;
  duration: number;
  message?: string;
}
```

### 3. Audio Analyzer

**Responsibility**: Extracts audio features in real-time using Web Audio API.

**Interface**:
```typescript
interface AudioAnalyzer {
  // Initialize with audio context
  initialize(audioContext: AudioContext, source: AudioBufferSourceNode): void;
  
  // Real-time analysis
  getFrequencyData(): Uint8Array;
  getTimeDomainData(): Uint8Array;
  getBPM(): number;
  getEnergy(): number;
  
  // Feature extraction for AI
  extractFeatures(): AudioFeatures;
  
  // Cleanup
  disconnect(): void;
}

interface AudioFeatures {
  tempo: number;
  key?: string;
  energy: number;
  valence: number; // Emotional positivity
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[]; // Mel-frequency cepstral coefficients
}
```

### 4. Visualization Engine

**Responsibility**: Renders visual effects synchronized with audio playback.

**Interface**:
```typescript
interface VisualizationEngine {
  // Initialize with canvas context
  initialize(canvas: HTMLCanvasElement): void;
  
  // Visualization modes
  setMode(mode: VisualizationMode): void;
  enableLayer(layer: VisualizationLayer): void;
  disableLayer(layer: VisualizationLayer): void;
  
  // Rendering
  render(audioData: AudioData, timestamp: number): void;
  
  // Configuration
  setConfig(config: VisualizationConfig): void;
}

type VisualizationMode = 
  | 'gradient'
  | 'equalizer'
  | 'spotlight'
  | 'ai-image'
  | 'combined';

type VisualizationLayer = 
  | 'background-gradient'
  | 'equalizer-bars'
  | 'spotlight-effects'
  | 'ai-generated-image'
  | 'particles';

interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bpm: number;
  energy: number;
}

interface VisualizationConfig {
  colors: ColorScheme;
  sensitivity: number;
  smoothing: number;
  layers: VisualizationLayer[];
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}
```

### 5. Poetry Generator

**Responsibility**: Generates poetry using AI based on audio features and user interactions.

**Interface**:
```typescript
interface PoetryGenerator {
  // Initialize with AI provider
  initialize(provider: AIProvider): Promise<void>;
  
  // Generate poetry
  generateFromAudio(features: AudioFeatures): Promise<string>;
  generateFromMood(mood: string): Promise<string>;
  generateFromInteraction(interaction: InteractionData): Promise<string>;
  
  // Streaming generation
  generateStream(
    features: AudioFeatures,
    callback: (chunk: string) => void
  ): Promise<void>;
  
  // Configuration
  setStyle(style: PoetryStyle): void;
  setProvider(provider: AIProvider): void;
}

type AIProvider = 'ollama' | 'bedrock';

interface PoetryStyle {
  tone: 'melancholic' | 'joyful' | 'energetic' | 'calm' | 'dramatic';
  length: 'short' | 'medium' | 'long';
  structure: 'free-verse' | 'haiku' | 'sonnet' | 'prose';
}

interface InteractionData {
  clickPosition: { x: number; y: number };
  dragPath: { x: number; y: number }[];
  timestamp: number;
}
```

### 6. AI Provider Service

**Responsibility**: Abstracts AI model access for both Ollama and AWS Bedrock.

**Interface**:
```typescript
interface AIProviderService {
  // Provider management
  setProvider(provider: AIProvider, config: ProviderConfig): Promise<void>;
  getCurrentProvider(): AIProvider;
  
  // Text generation
  generate(prompt: string, options: GenerationOptions): Promise<string>;
  generateStream(
    prompt: string,
    options: GenerationOptions,
    callback: (chunk: string) => void
  ): Promise<void>;
  
  // Health check
  isAvailable(): Promise<boolean>;
  checkResources(): Promise<ResourceStatus>;
}

interface ProviderConfig {
  ollama?: {
    endpoint: string;
    model: string;
  };
  bedrock?: {
    region: string;
    modelId: string;
    credentials: AWSCredentials;
  };
}

interface GenerationOptions {
  temperature: number;
  maxTokens: number;
  topP?: number;
  stopSequences?: string[];
}

interface ResourceStatus {
  available: boolean;
  gpuMemory?: number;
  gpuUtilization?: number;
  message?: string;
}
```

### 7. Canvas Controller

**Responsibility**: Manages user interactions with the interactive canvas.

**Interface**:
```typescript
interface CanvasController {
  // Initialize with canvas element
  initialize(canvas: HTMLCanvasElement): void;
  
  // Interaction handling
  onInteraction(callback: (interaction: InteractionEvent) => void): void;
  
  // Element management
  addElement(element: CanvasElement): void;
  removeElement(id: string): void;
  updateElement(id: string, updates: Partial<CanvasElement>): void;
  
  // State management
  getElements(): CanvasElement[];
  clearCanvas(): void;
}

interface InteractionEvent {
  type: 'click' | 'drag' | 'pinch' | 'hover';
  position: { x: number; y: number };
  element?: CanvasElement;
  timestamp: number;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'particle';
  position: { x: number; y: number };
  properties: Record<string, any>;
  interactive: boolean;
}
```

### 8. Storytelling Manager

**Responsibility**: Provides narrative context and guides user experience.

**Interface**:
```typescript
interface StorytellingManager {
  // Narrative progression
  showIntroduction(): void;
  showAnalysisMessage(stage: AnalysisStage): void;
  showTransition(from: string, to: string): void;
  showGuidanceHint(hint: string): void;
  showSummary(data: ExperienceSummary): void;
  
  // Configuration
  setNarrativeStyle(style: NarrativeStyle): void;
}

type AnalysisStage = 
  | 'loading'
  | 'validating'
  | 'analyzing'
  | 'generating'
  | 'ready';

type NarrativeStyle = 
  | 'minimal'
  | 'descriptive'
  | 'poetic'
  | 'technical';

interface ExperienceSummary {
  duration: number;
  poemsGenerated: number;
  interactionsCount: number;
  visualizationMode: VisualizationMode;
  highlights: string[];
}
```

### 9. Export Manager

**Responsibility**: Handles exporting and sharing of created experiences.

**Interface**:
```typescript
interface ExportManager {
  // Export functions
  exportPoetry(format: 'txt' | 'json' | 'markdown'): Promise<Blob>;
  exportCanvas(format: 'png' | 'jpg' | 'svg'): Promise<Blob>;
  exportExperience(): Promise<ExperienceData>;
  
  // Sharing
  generateShareURL(experience: ExperienceData): Promise<string>;
  loadFromShareURL(url: string): Promise<ExperienceData>;
}

interface ExperienceData {
  audioSource: {
    type: 'file' | 'url' | 'youtube';
    reference: string;
  };
  poems: string[];
  canvasState: CanvasElement[];
  visualizationConfig: VisualizationConfig;
  timestamp: number;
}
```

### 10. YouTube Extractor

**Responsibility**: Extracts audio from YouTube videos.

**Interface**:
```typescript
interface YouTubeExtractor {
  // Extract audio
  extractAudio(url: string): Promise<AudioBuffer>;
  
  // Metadata
  getVideoInfo(url: string): Promise<YouTubeVideoInfo>;
  
  // Validation
  isValidYouTubeURL(url: string): boolean;
}

interface YouTubeVideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  author: string;
}
```

## Data Models

### Audio Processing Models

```typescript
// Audio buffer with metadata
interface ProcessedAudio {
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
  metadata: AudioMetadata;
  features: AudioFeatures;
}

// Real-time audio frame
interface AudioFrame {
  timestamp: number;
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  rms: number; // Root mean square (volume)
  peak: number;
}
```

### Visualization Models

```typescript
// Gradient visualization state
interface GradientState {
  colors: [string, string];
  angle: number;
  animationPhase: number;
  bpmSync: boolean;
}

// Equalizer visualization state
interface EqualizerState {
  barCount: number;
  barWidth: number;
  barSpacing: number;
  smoothing: number;
  colorGradient: string[];
}

// Spotlight visualization state
interface SpotlightState {
  lights: Spotlight[];
  backgroundImage?: string;
  intensity: number;
}

interface Spotlight {
  position: { x: number; y: number };
  radius: number;
  color: string;
  velocity: { x: number; y: number };
}

// AI image visualization state
interface AIImageState {
  imageURL: string;
  opacity: number;
  blendMode: string;
  updateInterval: number;
}
```

### Poetry Models

```typescript
// Generated poem
interface Poem {
  id: string;
  text: string;
  timestamp: number;
  audioFeatures: AudioFeatures;
  style: PoetryStyle;
  source: AIProvider;
}

// Poetry generation request
interface PoetryRequest {
  audioFeatures: AudioFeatures;
  style: PoetryStyle;
  context?: string;
  previousPoems?: string[];
}
```

### Configuration Models

```typescript
// Application configuration
interface AppConfig {
  audio: {
    maxDuration: number;
    sampleRate: number;
    fftSize: number;
  };
  visualization: {
    fps: number;
    defaultMode: VisualizationMode;
    enabledLayers: VisualizationLayer[];
  };
  ai: {
    provider: AIProvider;
    ollamaConfig?: {
      endpoint: string;
      model: string;
      minGPUMemory: number;
    };
    bedrockConfig?: {
      region: string;
      modelId: string;
    };
  };
  storytelling: {
    enabled: boolean;
    style: NarrativeStyle;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Before defining the final properties, I've reviewed all testable criteria to eliminate redundancy:

**Redundancies Identified:**
- Properties 1.5 and 1.6 are inverses - testing duration rejection and acceptance. These can be combined into a single boundary validation property.
- Properties 2.4 and 2.5 about pause/resume can be combined into a single state management property.
- Properties 3.1, 3.2, and 3.3 about poetry generation, timing, and display can be streamlined - the core property is that poetry is generated and displayed based on audio features.
- Multiple properties about steering documents and agent hooks (5.1-5.4, 6.1-6.4, 10.1-10.4) are all examples of documentation/configuration existence - these should be tested as examples, not separate properties.
- Properties 9.3 and 9.4 form a round-trip property for sharing - these should be combined.

**Consolidated Properties:**
After reflection, the core properties focus on:
1. Audio validation and processing
2. Real-time synchronization between audio and visuals
3. AI generation consistency and fallback
4. Interactive canvas responsiveness
5. Data persistence and round-trip integrity
6. Error handling and recovery
7. Configuration flexibility

### Core Correctness Properties

**Property 1: File format validation**
*For any* file input, the system should accept only MP3 and OGG formats and reject all other formats with appropriate error messages.
**Validates: Requirements 1.1**

**Property 2: URL validation and fetching**
*For any* valid HTTP/HTTPS URL, the system should successfully validate the URL format and attempt to fetch the audio resource.
**Validates: Requirements 1.2**

**Property 3: Duration boundary validation**
*For any* audio source, if the duration exceeds 300 seconds (5 minutes), the system should reject it; if the duration is 300 seconds or less, the system should accept it for processing.
**Validates: Requirements 1.4, 1.5, 1.6**

**Property 4: Audio-visual synchronization**
*For any* audio playback state, the visualization engine should render frames synchronized with the audio timeline, ensuring visual updates correspond to the current audio position.
**Validates: Requirements 2.1, 2.2, 2.3**

**Property 5: Playback state preservation**
*For any* visualization state, when audio is paused and then resumed, the visualization should continue from the correct audio position without data loss or desynchronization.
**Validates: Requirements 2.4, 2.5**

**Property 6: BPM synchronization**
*For any* detected BPM value, gradient animations should cycle at a rate that matches the beat tempo (animations per minute = BPM).
**Validates: Requirements 2.7**

**Property 7: Equalizer responsiveness**
*For any* frequency data frame, equalizer bar heights should correspond proportionally to the amplitude values in the frequency spectrum.
**Validates: Requirements 2.8**

**Property 8: Poetry generation from audio features**
*For any* completed audio analysis with extracted features, the poetry generator should produce poetry output that incorporates the audio characteristics (tempo, energy, mood).
**Validates: Requirements 3.1**

**Property 9: Poetry timing synchronization**
*For any* audio playback session, poetry should be generated at regular time intervals or musical phrase boundaries, maintaining consistent generation timing.
**Validates: Requirements 3.2**

**Property 10: Poetry persistence**
*For any* poetry generated during a session, all poems should remain accessible after audio playback ends, with no data loss.
**Validates: Requirements 3.5**

**Property 11: AI provider output consistency**
*For any* given audio features and poetry style, switching between AI providers (Ollama/Bedrock) should produce poetry with consistent formatting structure (line breaks, stanza organization).
**Validates: Requirements 3.8**

**Property 12: Canvas interaction responsiveness**
*For any* user interaction (click, drag) on a canvas element, the system should provide immediate visual feedback within one frame (< 16ms at 60fps).
**Validates: Requirements 4.1, 4.2**

**Property 13: Interaction data flow**
*For any* canvas interaction event, the interaction data should be passed to the poetry generator and influence subsequent poetry generation.
**Validates: Requirements 4.3**

**Property 14: Non-blocking visual updates**
*For any* visual parameter modification during audio playback, the audio should continue playing without interruption or timing drift.
**Validates: Requirements 4.4**

**Property 15: Element layering and interaction priority**
*For any* set of overlapping canvas elements, interaction events should target the topmost (highest z-index) element at the interaction coordinates.
**Validates: Requirements 4.5**

**Property 16: Error message generation**
*For any* error condition (file load failure, AI service unavailable, network error), the system should display a user-friendly error message and maintain application stability.
**Validates: Requirements 8.1, 8.5**

**Property 17: AI service fallback**
*For any* AI service failure, the poetry generator should fall back to template-based generation using audio features, ensuring poetry is always produced.
**Validates: Requirements 8.2**

**Property 18: Network retry logic**
*For any* network request failure during URL audio fetching, the system should retry exactly 3 times before displaying an error.
**Validates: Requirements 8.4**

**Property 19: Poetry export integrity**
*For any* generated poetry collection, exporting to text format should preserve all poem content, ordering, and basic formatting.
**Validates: Requirements 9.1**

**Property 20: Canvas export integrity**
*For any* canvas state, exporting to image format should capture all visible elements with correct positioning and styling.
**Validates: Requirements 9.2**

**Property 21: Experience sharing round-trip**
*For any* completed experience, generating a share URL and then loading from that URL should recreate the experience with the same audio source, visualization settings, and initial configuration.
**Validates: Requirements 9.3, 9.4**

**Property 22: Configuration-based provider switching**
*For any* AI provider configuration change, the system should switch providers without requiring code modifications, only configuration updates.
**Validates: Requirements 11.6**

**Property 23: Provider availability detection**
*For any* configured AI provider, if the provider is unavailable, the system should detect this condition and display appropriate error guidance.
**Validates: Requirements 11.5**

**Property 24: Resource verification**
*For any* Ollama configuration, the system should verify GPU resource availability before attempting to use the local AI service.
**Validates: Requirements 11.4**

**Property 25: Visualization mode switching continuity**
*For any* visualization mode change during audio playback, the audio should continue playing without interruption and the new visualization should render from the current audio position.
**Validates: Requirements 12.6**

**Property 26: Visualization layer composition**
*For any* combination of enabled visualization layers, the rendering should composite layers in the correct order (background → effects → foreground) with proper blending.
**Validates: Requirements 12.7**

## Error Handling

### Error Categories

1. **Audio Loading Errors**
   - Invalid file format
   - Corrupted audio data
   - Network timeout for URL/YouTube sources
   - Duration exceeds limit

2. **Audio Processing Errors**
   - Web Audio API not supported
   - Audio context creation failure
   - Decoding errors

3. **AI Service Errors**
   - Provider unavailable
   - Authentication failure
   - Rate limiting
   - Insufficient GPU resources (Ollama)
   - Invalid response format

4. **Visualization Errors**
   - Canvas context creation failure
   - WebGL not supported (for advanced effects)
   - Animation frame request failure

5. **Export Errors**
   - Canvas to blob conversion failure
   - File system access denied
   - Share URL generation failure

### Error Handling Strategy

```typescript
interface ErrorHandler {
  // Error classification
  classifyError(error: Error): ErrorCategory;
  
  // Error recovery
  attemptRecovery(error: Error): Promise<RecoveryResult>;
  
  // User notification
  notifyUser(error: Error, context: ErrorContext): void;
  
  // Logging
  logError(error: Error, context: ErrorContext): void;
}

interface RecoveryResult {
  recovered: boolean;
  fallbackAction?: () => void;
  message: string;
}

interface ErrorContext {
  component: string;
  operation: string;
  timestamp: number;
  userAction?: string;
}
```

### Fallback Mechanisms

1. **AI Service Fallback**
   - Primary: Configured AI provider (Ollama/Bedrock)
   - Fallback: Template-based poetry using audio features
   - Templates categorized by mood: energetic, calm, melancholic, joyful

2. **Visualization Fallback**
   - Primary: WebGL-accelerated rendering
   - Fallback: Canvas 2D API rendering
   - Graceful degradation of effects

3. **Audio Source Fallback**
   - Primary: Direct audio loading
   - Fallback: Proxy service for CORS issues
   - Error message with alternative suggestions

## Testing Strategy

### Unit Testing

**Framework**: Vitest (for TypeScript/JavaScript)

**Test Coverage Areas**:

1. **Audio Processing**
   - Duration validation logic
   - File format detection
   - URL validation
   - Audio feature extraction algorithms

2. **Visualization**
   - Color scheme generation
   - BPM calculation
   - Coordinate transformations
   - Layer composition logic

3. **Poetry Generation**
   - Prompt construction from audio features
   - Template selection logic
   - Response parsing
   - Fallback mechanism

4. **Canvas Interaction**
   - Hit detection algorithms
   - Element positioning
   - Z-index sorting
   - Drag calculation

5. **Export/Import**
   - Data serialization
   - URL encoding/decoding
   - Image generation
   - Text formatting

**Example Unit Tests**:

```typescript
describe('DurationValidator', () => {
  it('should reject audio longer than 5 minutes', () => {
    const validator = new DurationValidator();
    const result = validator.validate(301); // 5:01
    expect(result.isValid).toBe(false);
  });

  it('should accept audio exactly 5 minutes', () => {
    const validator = new DurationValidator();
    const result = validator.validate(300); // 5:00
    expect(result.isValid).toBe(true);
  });
});

describe('VisualizationEngine', () => {
  it('should calculate correct bar heights from frequency data', () => {
    const engine = new VisualizationEngine();
    const frequencyData = new Uint8Array([128, 255, 64, 0]);
    const barHeights = engine.calculateBarHeights(frequencyData);
    expect(barHeights).toHaveLength(4);
    expect(barHeights[1]).toBeGreaterThan(barHeights[0]);
  });
});
```

### Property-Based Testing

**Framework**: fast-check (for TypeScript/JavaScript)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test MUST include a comment tag in this exact format:
```typescript
// **Feature: music-poetry-canvas, Property {number}: {property_text}**
```

**Property Test Coverage**:

1. **Audio Validation Properties**
   - Property 1: File format validation
   - Property 3: Duration boundary validation

2. **Synchronization Properties**
   - Property 4: Audio-visual synchronization
   - Property 5: Playback state preservation
   - Property 6: BPM synchronization

3. **Generation Properties**
   - Property 8: Poetry generation from audio features
   - Property 9: Poetry timing synchronization
   - Property 11: AI provider output consistency

4. **Interaction Properties**
   - Property 12: Canvas interaction responsiveness
   - Property 15: Element layering and interaction priority

5. **Data Integrity Properties**
   - Property 10: Poetry persistence
   - Property 19: Poetry export integrity
   - Property 21: Experience sharing round-trip

6. **Error Handling Properties**
   - Property 16: Error message generation
   - Property 17: AI service fallback
   - Property 18: Network retry logic

**Example Property Tests**:

```typescript
import fc from 'fast-check';

// **Feature: music-poetry-canvas, Property 3: Duration boundary validation**
describe('Property: Duration boundary validation', () => {
  it('should correctly validate duration boundaries', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000 }), // Generate random durations
        (duration) => {
          const validator = new DurationValidator();
          const result = validator.validate(duration);
          
          // Property: duration > 300 => invalid, duration <= 300 => valid
          if (duration > 300) {
            expect(result.isValid).toBe(false);
            expect(result.message).toBeDefined();
          } else {
            expect(result.isValid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: music-poetry-canvas, Property 21: Experience sharing round-trip**
describe('Property: Experience sharing round-trip', () => {
  it('should preserve experience data through share URL round-trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          audioSource: fc.record({
            type: fc.constantFrom('file', 'url', 'youtube'),
            reference: fc.string()
          }),
          visualizationMode: fc.constantFrom('gradient', 'equalizer', 'spotlight', 'ai-image'),
          poems: fc.array(fc.string(), { minLength: 1, maxLength: 10 })
        }),
        async (experienceData) => {
          const exportManager = new ExportManager();
          
          // Generate share URL
          const shareURL = await exportManager.generateShareURL(experienceData);
          
          // Load from share URL
          const loadedData = await exportManager.loadFromShareURL(shareURL);
          
          // Property: loaded data should match original
          expect(loadedData.audioSource).toEqual(experienceData.audioSource);
          expect(loadedData.visualizationMode).toEqual(experienceData.visualizationMode);
          expect(loadedData.poems).toEqual(experienceData.poems);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: music-poetry-canvas, Property 15: Element layering and interaction priority**
describe('Property: Element layering and interaction priority', () => {
  it('should always select topmost element at interaction coordinates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            position: fc.record({ x: fc.float(), y: fc.float() }),
            zIndex: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        fc.record({ x: fc.float(), y: fc.float() }),
        (elements, clickPosition) => {
          const controller = new CanvasController();
          elements.forEach(el => controller.addElement(el));
          
          // Find elements at click position
          const elementsAtPosition = elements.filter(el =>
            isPointInElement(clickPosition, el)
          );
          
          if (elementsAtPosition.length > 0) {
            const targetElement = controller.getElementAtPosition(clickPosition);
            const expectedElement = elementsAtPosition.reduce((top, current) =>
              current.zIndex > top.zIndex ? current : top
            );
            
            // Property: selected element should have highest z-index
            expect(targetElement?.id).toBe(expectedElement.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Focus Areas**:

1. **Audio Pipeline Integration**
   - File upload → validation → analysis → visualization
   - URL fetch → validation → analysis → visualization
   - YouTube extraction → validation → analysis → visualization

2. **AI Integration**
   - Audio features → AI provider → poetry display
   - Provider switching → consistent output
   - Fallback mechanism activation

3. **User Interaction Flow**
   - Canvas interaction → poetry generation → display
   - Mode switching → visualization update
   - Export → share → reload

4. **Error Recovery Flow**
   - Error occurrence → fallback activation → user notification
   - Retry logic → success/failure handling

### Performance Testing

**Metrics to Monitor**:

1. **Audio Processing**
   - Time to analyze audio file
   - Real-time analysis latency (< 10ms per frame)

2. **Visualization**
   - Frame rate (target: 60 FPS)
   - Render time per frame (< 16ms)

3. **AI Generation**
   - Time to first poetry token
   - Total generation time
   - Ollama vs Bedrock comparison

4. **Memory Usage**
   - Audio buffer memory
   - Canvas memory
   - AI model memory (Ollama)

## Implementation Notes

### Technology Stack

**Frontend**:
- **Framework**: React with TypeScript
- **Audio**: Web Audio API
- **Canvas**: HTML5 Canvas API / WebGL for advanced effects
- **State Management**: Zustand or Jotai (lightweight)
- **Styling**: Tailwind CSS for UI components

**AI Integration**:
- **Ollama**: Direct HTTP API calls to local endpoint
- **AWS Bedrock**: AWS SDK for JavaScript (v3)

**Build Tools**:
- **Bundler**: Vite
- **Testing**: Vitest + fast-check
- **Linting**: ESLint + Prettier

### Web Audio API Usage

```typescript
// Audio context setup
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

// Connect audio source
const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(analyser);
analyser.connect(audioContext.destination);

// Extract frequency data
const frequencyData = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(frequencyData);
```

### Canvas Rendering Optimization

1. **Double Buffering**: Use off-screen canvas for complex rendering
2. **Request Animation Frame**: Sync with browser refresh rate
3. **Dirty Rectangle**: Only redraw changed regions
4. **Layer Caching**: Cache static layers, only update dynamic ones

### AI Prompt Engineering

**Poetry Generation Prompt Template**:
```
Generate a poetic verse inspired by music with the following characteristics:
- Tempo: {tempo} BPM
- Energy: {energy} (0-1 scale)
- Mood: {mood}
- Key: {key}

Style: {style}
Length: {length}

Create evocative imagery that captures the essence of this music.
```

### Kiro Integration

**Steering Documents Structure**:
```
.kiro/steering/
├── architecture.md          # System architecture overview
├── audio-processing.md      # Audio analysis best practices
├── visualization.md         # Canvas rendering techniques
├── ai-integration.md        # AI provider setup and usage
└── testing-guidelines.md    # Testing strategies and examples
```

**Agent Hooks Configuration**:
```json
{
  "hooks": [
    {
      "name": "Test Audio Module",
      "trigger": "onFileSave",
      "filePattern": "src/audio/**/*.ts",
      "action": "runCommand",
      "command": "npm test -- src/audio"
    },
    {
      "name": "Visual Regression Test",
      "trigger": "onCommit",
      "filePattern": "src/visualization/**/*.ts",
      "action": "runCommand",
      "command": "npm run test:visual"
    },
    {
      "name": "Validate AI Integration",
      "trigger": "onFileSave",
      "filePattern": "src/ai/**/*.ts",
      "action": "runCommand",
      "command": "npm test -- src/ai"
    }
  ]
}
```

### YouTube Audio Extraction

**Approach**: Use a backend proxy service or library like `ytdl-core` (Node.js) or `yt-dlp` (Python) to extract audio streams. For web-only solution, consider using a serverless function (AWS Lambda) to handle extraction.

**Security Considerations**:
- Validate YouTube URLs before processing
- Implement rate limiting
- Cache extracted audio (with expiration)
- Handle YouTube API changes gracefully

### AWS Bedrock Integration

**Model Selection**: Claude 3 Haiku or Claude 3 Sonnet for poetry generation

**Configuration**:
```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const response = await client.send(new InvokeModelCommand({
  modelId: "anthropic.claude-3-haiku-20240307-v1:0",
  body: JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: prompt
    }]
  })
}));
```

### Ollama Integration

**Setup**:
1. Install Ollama locally
2. Pull a suitable model: `ollama pull gemma3:4b` or `ollama pull mistral`
3. Start Ollama service: `ollama serve`

**API Usage**:
```typescript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemma3:4b',
    prompt: prompt,
    stream: false
  })
});

const data = await response.json();
const poetry = data.response;
```

### Performance Optimization

1. **Web Workers**: Offload audio analysis to worker threads
2. **Lazy Loading**: Load visualization modes on demand
3. **Code Splitting**: Split by route and feature
4. **Asset Optimization**: Compress images, use WebP format
5. **Caching**: Cache AI responses for similar audio features

### Accessibility Considerations

1. **Keyboard Navigation**: Full keyboard support for all interactions
2. **Screen Reader**: ARIA labels for canvas elements and controls
3. **Color Contrast**: Ensure sufficient contrast in visualizations
4. **Motion Reduction**: Respect `prefers-reduced-motion` media query
5. **Alternative Text**: Provide text descriptions for visual elements

## Deployment Considerations

### Environment Configuration

**Development**:
- Ollama for AI (local)
- Local audio files
- Debug logging enabled

**Production**:
- AWS Bedrock for AI (cloud)
- Support all audio sources
- Error tracking (Sentry)
- Analytics (optional)

### Hosting Options

1. **Static Hosting**: Vercel, Netlify, AWS S3 + CloudFront
2. **Backend Services**: AWS Lambda for YouTube extraction
3. **CDN**: CloudFront for global distribution

### Security

1. **API Keys**: Store in environment variables, never commit
2. **CORS**: Configure properly for audio URL fetching
3. **Rate Limiting**: Prevent abuse of AI services
4. **Input Validation**: Sanitize all user inputs
5. **CSP**: Content Security Policy headers

## Future Enhancements

1. **Collaborative Mode**: Multiple users interact with same canvas
2. **Audio Effects**: Apply real-time audio effects
3. **3D Visualization**: WebGL-based 3D visualizations
4. **Voice Input**: Generate poetry from spoken descriptions
5. **Music Generation**: AI-generated music based on poetry
6. **Social Features**: Share and discover experiences
7. **Mobile App**: Native iOS/Android apps
8. **VR Support**: Immersive VR experience
