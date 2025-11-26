---
inclusion: always
---

# Music Poetry Canvas - Project Overview & Common Guidelines

This steering document provides essential context and guidelines for the Music Poetry Canvas project. All developers should be familiar with this content before implementing features.

## Project Vision

Music Poetry Canvas is an immersive web application that transforms music into a multi-sensory experience by combining:
- Real-time audio visualization
- AI-generated poetry
- Interactive canvas elements
- Storytelling narrative

The goal is to create a seamless, performant, and emotionally engaging experience that showcases the power of combining audio analysis, AI, and interactive graphics.

## Core Principles

### 1. Modularity First
- Each component (audio, visualization, AI, canvas) operates independently
- Clear interfaces between components
- Easy to test, replace, or extend individual components

### 2. Performance is Critical
- Target: 60 FPS for visualizations
- Audio analysis must not block the main thread
- Use Web Workers for heavy computations
- Lazy load visualization modes

### 3. Graceful Degradation
- Always provide fallbacks (AI templates, 2D canvas, etc.)
- Never crash - handle all errors gracefully
- Inform users clearly when features are unavailable

### 4. Developer Experience
- Comprehensive TypeScript types
- Clear error messages
- Well-documented APIs
- Automated testing via agent hooks

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│  (React Components + Canvas)            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Application Core Layer            │
│  (Managers + Controllers)               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Service Layer                  │
│  (Audio API, AI Providers, Extractors) │
└─────────────────────────────────────────┘
```

**Key Insight**: Data flows downward (UI → Core → Services), events flow upward (Services → Core → UI).

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand (lightweight, no boilerplate)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite (fast HMR, optimized builds)

### Audio Processing
- **API**: Web Audio API (native browser support)
- **Analysis**: AnalyserNode for frequency/time domain data
- **Feature Extraction**: Custom algorithms for BPM, energy, mood

### Visualization
- **Primary**: HTML5 Canvas 2D API
- **Advanced**: WebGL for complex effects (with 2D fallback)
- **Animation**: RequestAnimationFrame for smooth 60 FPS

### AI Integration
- **Development**: Ollama (local, RTX 3060 compatible)
- **Production**: AWS Bedrock (Claude models)
- **Fallback**: Template-based poetry generation

### Testing
- **Unit Tests**: Vitest
- **Property Tests**: fast-check (100+ iterations per property)
- **Integration**: Vitest with DOM testing library

## Common Patterns

### 1. Error Handling Pattern

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  // Log for debugging
  console.error('[ComponentName]', error);
  
  // Attempt recovery
  const fallback = await attemptFallback();
  
  // Notify user
  notifyUser({
    type: 'error',
    message: 'User-friendly message',
    action: 'Suggested action'
  });
  
  return { success: false, error, fallback };
}
```

### 2. Configuration Pattern

All configurable values should be centralized:

```typescript
// config.ts
export const CONFIG = {
  audio: {
    MAX_DURATION: 300, // 5 minutes in seconds
    SAMPLE_RATE: 44100,
    FFT_SIZE: 2048
  },
  visualization: {
    TARGET_FPS: 60,
    SMOOTHING: 0.8
  },
  ai: {
    PROVIDER: process.env.AI_PROVIDER || 'ollama',
    OLLAMA_ENDPOINT: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    BEDROCK_REGION: process.env.AWS_REGION || 'us-east-1'
  }
} as const;
```

### 3. Event Subscription Pattern

```typescript
interface EventEmitter<T> {
  subscribe(callback: (data: T) => void): () => void;
  emit(data: T): void;
}

// Usage
const unsubscribe = audioManager.onTimeUpdate((time) => {
  updateVisualization(time);
});

// Cleanup
unsubscribe();
```

### 4. Async Initialization Pattern

```typescript
class Component {
  private initialized = false;
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Setup logic
    await this.setup();
    
    this.initialized = true;
  }
  
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Component not initialized. Call initialize() first.');
    }
  }
  
  public doSomething(): void {
    this.ensureInitialized();
    // Implementation
  }
}
```

## Audio Processing Guidelines

### Duration Validation
**Always validate duration before processing:**
```typescript
const MAX_DURATION = 300; // 5 minutes

if (audioDuration > MAX_DURATION) {
  throw new Error(`Audio duration (${audioDuration}s) exceeds limit (${MAX_DURATION}s)`);
}
```

### Web Audio API Best Practices

1. **Create AudioContext once**: Reuse across the application
2. **Resume context on user interaction**: Browsers require user gesture
3. **Disconnect nodes when done**: Prevent memory leaks
4. **Use AnalyserNode for visualization**: Don't process raw audio data

```typescript
// Good: Reuse context
const audioContext = new AudioContext();

// Good: Resume on user interaction
button.addEventListener('click', async () => {
  await audioContext.resume();
  source.start();
});

// Good: Cleanup
source.disconnect();
analyser.disconnect();
```

### Feature Extraction

Extract these features for AI poetry generation:
- **Tempo (BPM)**: Beat detection algorithm
- **Energy**: RMS of audio signal
- **Spectral Centroid**: "Brightness" of sound
- **Zero Crossing Rate**: Percussiveness indicator
- **MFCC**: Timbre characteristics

## Visualization Guidelines

### Performance Optimization

1. **Use RequestAnimationFrame**: Sync with browser refresh
```typescript
const animate = () => {
  render();
  requestAnimationFrame(animate);
};
requestAnimationFrame(animate);
```

2. **Limit Canvas Operations**: Batch draws, avoid unnecessary clears
```typescript
// Bad: Clear entire canvas every frame
ctx.clearRect(0, 0, width, height);

// Good: Clear only changed regions
ctx.clearRect(dirtyRect.x, dirtyRect.y, dirtyRect.width, dirtyRect.height);
```

3. **Use Off-screen Canvas**: For complex rendering
```typescript
const offscreen = document.createElement('canvas');
const offscreenCtx = offscreen.getContext('2d');
// Render to offscreen
// Then copy to main canvas
ctx.drawImage(offscreen, 0, 0);
```

### Visualization Modes

Each mode should be self-contained and follow this interface:

```typescript
interface VisualizationMode {
  name: string;
  initialize(canvas: HTMLCanvasElement): void;
  render(audioData: AudioData, timestamp: number): void;
  cleanup(): void;
}
```

**Available Modes**:
1. **Gradient**: BPM-synchronized two-tone gradient
2. **Equalizer**: Frequency bars overlay
3. **Spotlight**: Animated lights on background image
4. **AI Image**: AI-generated imagery as background

### Color Schemes

Use consistent color schemes across visualizations:

```typescript
const COLOR_SCHEMES = {
  energetic: { primary: '#FF6B6B', secondary: '#4ECDC4' },
  calm: { primary: '#A8DADC', secondary: '#457B9D' },
  melancholic: { primary: '#6C5B7B', secondary: '#C06C84' },
  joyful: { primary: '#FFD93D', secondary: '#6BCF7F' }
};
```

## AI Integration Guidelines

### Provider Abstraction

Never directly call Ollama or Bedrock APIs in business logic. Always use the AIProviderService:

```typescript
// Bad: Direct API call
const response = await fetch('http://localhost:11434/api/generate', ...);

// Good: Use abstraction
const poetry = await aiProvider.generate(prompt, options);
```

### Prompt Engineering

**Structure prompts consistently**:

```typescript
const buildPrompt = (features: AudioFeatures): string => {
  return `Generate a poetic verse inspired by music with these characteristics:

Tempo: ${features.tempo} BPM
Energy: ${features.energy.toFixed(2)} (0-1 scale)
Mood: ${features.mood}

Create evocative imagery that captures the essence of this music.
Keep it concise (2-4 lines).`;
};
```

### Fallback Templates

Always provide template-based fallback:

```typescript
const POETRY_TEMPLATES = {
  energetic: [
    'Pulsing rhythms drive the night,\nBeats that set the soul alight.',
    'Thunder rolls through electric veins,\nEnergy that never wanes.'
  ],
  calm: [
    'Gentle waves upon the shore,\nPeaceful moments, nothing more.',
    'Soft whispers in the breeze,\nQuiet thoughts that bring us ease.'
  ]
  // ... more templates
};
```

### Resource Management (Ollama)

Check GPU resources before using Ollama:

```typescript
const checkOllamaResources = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return false;
    
    // Check if models are available
    const data = await response.json();
    return data.models && data.models.length > 0;
  } catch {
    return false;
  }
};
```

## Canvas Interaction Guidelines

### Hit Detection

Implement efficient hit detection for interactive elements:

```typescript
const isPointInElement = (
  point: { x: number; y: number },
  element: CanvasElement
): boolean => {
  const { x, y, width, height } = element.bounds;
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  );
};
```

### Z-Index Management

Maintain proper layering:

```typescript
const sortByZIndex = (elements: CanvasElement[]): CanvasElement[] => {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
};

// Render from back to front
sortByZIndex(elements).forEach(element => render(element));
```

### Interaction Events

Handle all interaction types consistently:

```typescript
canvas.addEventListener('click', handleClick);
canvas.addEventListener('mousedown', handleDragStart);
canvas.addEventListener('mousemove', handleDragMove);
canvas.addEventListener('mouseup', handleDragEnd);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);
```

## Testing Guidelines

### Unit Tests

Focus on pure functions and business logic:

```typescript
describe('DurationValidator', () => {
  it('should reject audio longer than 5 minutes', () => {
    const validator = new DurationValidator();
    expect(validator.validate(301).isValid).toBe(false);
  });
  
  it('should accept audio at exactly 5 minutes', () => {
    const validator = new DurationValidator();
    expect(validator.validate(300).isValid).toBe(true);
  });
});
```

### Property-Based Tests

Test universal properties with random inputs:

```typescript
import fc from 'fast-check';

// **Feature: music-poetry-canvas, Property 3: Duration boundary validation**
it('should correctly validate all duration boundaries', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0, max: 1000 }),
      (duration) => {
        const validator = new DurationValidator();
        const result = validator.validate(duration);
        
        if (duration > 300) {
          expect(result.isValid).toBe(false);
        } else {
          expect(result.isValid).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
src/
├── audio/
│   ├── AudioManager.ts
│   ├── AudioManager.test.ts
│   └── DurationValidator.test.ts
├── visualization/
│   ├── VisualizationEngine.ts
│   └── VisualizationEngine.test.ts
└── ai/
    ├── PoetryGenerator.ts
    └── PoetryGenerator.test.ts
```

## Environment Configuration

### Development (.env.development)
```bash
AI_PROVIDER=ollama
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
LOG_LEVEL=debug
```

### Production (.env.production)
```bash
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
LOG_LEVEL=error
```

### Environment Variables

**Required**:
- `AI_PROVIDER`: 'ollama' | 'bedrock'

**Ollama**:
- `OLLAMA_ENDPOINT`: Ollama API endpoint
- `OLLAMA_MODEL`: Model name (e.g., 'gemma3:4b', 'mistral')

**Bedrock**:
- `AWS_REGION`: AWS region
- `AWS_ACCESS_KEY_ID`: AWS credentials
- `AWS_SECRET_ACCESS_KEY`: AWS credentials
- `AWS_BEDROCK_MODEL_ID`: Bedrock model ID

## Common Pitfalls & Solutions

### 1. Audio Context Suspended

**Problem**: AudioContext starts in suspended state
**Solution**: Resume on user interaction

```typescript
document.addEventListener('click', async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}, { once: true });
```

### 2. CORS Issues with Audio URLs

**Problem**: Cannot load audio from external URLs
**Solution**: Use proxy or ensure CORS headers

```typescript
const fetchAudio = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }
  
  return response.arrayBuffer();
};
```

### 3. Memory Leaks in Canvas

**Problem**: Canvas elements not cleaned up
**Solution**: Explicit cleanup in useEffect

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  const engine = new VisualizationEngine();
  engine.initialize(canvas);
  
  return () => {
    engine.cleanup(); // Important!
  };
}, []);
```

### 4. AI Generation Timeout

**Problem**: AI takes too long to respond
**Solution**: Implement timeout and fallback

```typescript
const generateWithTimeout = async (
  prompt: string,
  timeoutMs: number = 10000
): Promise<string> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  
  try {
    return await Promise.race([
      aiProvider.generate(prompt),
      timeoutPromise
    ]);
  } catch (error) {
    // Fallback to template
    return getTemplatePoetry(audioFeatures);
  }
};
```

### 5. YouTube Extraction Failures

**Problem**: YouTube URL extraction fails
**Solution**: Validate URL and provide clear error

```typescript
const isValidYouTubeURL = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
};

if (!isValidYouTubeURL(url)) {
  throw new Error('Invalid YouTube URL. Please use format: https://youtube.com/watch?v=...');
}
```

## File Organization

```
src/
├── components/          # React components
│   ├── AudioInput/
│   ├── VisualizationCanvas/
│   ├── PoetryDisplay/
│   └── InteractiveCanvas/
├── core/               # Core business logic
│   ├── AudioManager.ts
│   ├── VisualizationEngine.ts
│   ├── PoetryGenerator.ts
│   └── CanvasController.ts
├── services/           # External service integrations
│   ├── AIProviderService.ts
│   ├── YouTubeExtractor.ts
│   └── AudioAnalyzer.ts
├── utils/              # Utility functions
│   ├── audioFeatures.ts
│   ├── colorSchemes.ts
│   └── validation.ts
├── types/              # TypeScript type definitions
│   ├── audio.ts
│   ├── visualization.ts
│   └── poetry.ts
├── config/             # Configuration
│   └── config.ts
└── hooks/              # Custom React hooks
    ├── useAudioManager.ts
    ├── useVisualization.ts
    └── usePoetryGenerator.ts
```

## Naming Conventions

### Files
- Components: PascalCase (e.g., `AudioInput.tsx`)
- Utilities: camelCase (e.g., `audioFeatures.ts`)
- Types: camelCase (e.g., `audio.ts`)
- Tests: Same as source + `.test.ts` (e.g., `AudioManager.test.ts`)

### Code
- Interfaces: PascalCase with 'I' prefix optional (e.g., `AudioManager` or `IAudioManager`)
- Types: PascalCase (e.g., `VisualizationMode`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_DURATION`)
- Functions: camelCase (e.g., `extractAudioFeatures`)
- React Components: PascalCase (e.g., `AudioInput`)

## Git Workflow

### Branch Naming
- Feature: `feature/audio-analysis`
- Bug fix: `fix/duration-validation`
- Refactor: `refactor/visualization-engine`

### Commit Messages
```
feat: add BPM detection to audio analyzer
fix: correct duration validation boundary
refactor: extract AI provider abstraction
test: add property tests for duration validator
docs: update steering document with audio guidelines
```

## Performance Targets

- **Audio Analysis Latency**: < 10ms per frame
- **Visualization Frame Rate**: 60 FPS (16.67ms per frame)
- **AI Poetry Generation**: < 5s for first token
- **Canvas Interaction Response**: < 16ms (1 frame)
- **Memory Usage**: < 500MB total
- **Initial Load Time**: < 3s

## Accessibility Requirements

1. **Keyboard Navigation**: All features accessible via keyboard
2. **Screen Reader**: ARIA labels for all interactive elements
3. **Color Contrast**: WCAG AA compliance (4.5:1 ratio)
4. **Motion**: Respect `prefers-reduced-motion`
5. **Focus Indicators**: Clear focus states for all interactive elements

## Security Considerations

1. **API Keys**: Never commit to repository
2. **Input Validation**: Sanitize all user inputs
3. **CORS**: Configure properly for audio fetching
4. **Rate Limiting**: Prevent AI service abuse
5. **CSP**: Content Security Policy headers

## Resources & References

### Documentation
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [AWS Bedrock](https://docs.aws.amazon.com/bedrock/)
- [fast-check](https://fast-check.dev/)

### Design References
- #[[file:requirements.md]] - Full requirements specification
- #[[file:design.md]] - Detailed design document

### Related Steering Documents
- Audio Processing Best Practices (to be created)
- Visualization Techniques (to be created)
- AI Integration Guide (to be created)

## Questions & Support

When implementing features:
1. Check this steering document first
2. Review the design document for detailed specifications
3. Look at existing code for patterns
4. Ask in team chat if unclear
5. Update this document if you discover new patterns or solutions

---

**Last Updated**: 2025-11-26
**Maintainers**: Development Team
**Version**: 1.0
