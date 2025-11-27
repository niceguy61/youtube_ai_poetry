# AI Prompt Engineering Guidelines for Music Poetry Canvas

This document provides guidelines for writing effective AI prompts in the Music Poetry Canvas project, specifically for poetry generation and visualization configuration.

## Core Principles

### 1. **Be Explicit About Output Format**
AI models (especially thinking models like Qwen3) may spend tokens on internal reasoning. Always specify the exact output format.

```typescript
// ❌ Bad: Vague instruction
"Generate a poem based on this music."

// ✅ Good: Explicit format
"Output ONLY the poem in Korean, nothing else (no titles, no explanations)."
```

### 2. **Emphasize Critical Requirements**
Use visual emphasis (CAPS, bold markers) for critical instructions:

```typescript
// ✅ Good: Emphasized requirements
`IMPORTANT REQUIREMENTS:
1. The poem MUST reflect the PRIMARY MOOD (${mood})
2. Write 400-550 characters (approximately 12-16 lines in Korean)
3. Output ONLY the poem, nothing else`
```

### 3. **Provide Concrete Length Specifications**
Don't use vague terms like "keep it short" or "make it long". Use specific character/line counts:

```typescript
// ❌ Bad: Vague length
"Keep under 500 characters"

// ✅ Good: Specific length
"Write approximately 450-550 characters in Korean (about 12-16 lines)"
```

### 4. **Prioritize Audio Features Clearly**
When multiple audio features might contradict, establish clear priority:

```typescript
// ✅ Good: Clear priority
`- PRIMARY MOOD: ${mood.toUpperCase()} - This should be the dominant feeling
- Intensity: ${intensity}% (${intensityDesc}) - THIS IS THE DOMINANT CHARACTERISTIC
- Energy level: ${energy} (${energyDesc}) - secondary characteristic`
```

### 5. **Handle Thinking Models**
Models with thinking capabilities (Qwen3, o1) consume tokens for reasoning. Account for this:

```typescript
// ✅ Good: Increased token limits for thinking models
const maxTokens = {
  short: 300,   // Increased from 150
  medium: 800,  // Increased from 400
  long: 1500,   // Increased from 800
};

// ✅ Good: Explicit "no thinking" instruction
"IMPORTANT: Return ONLY the complete JSON object. No thinking process, no explanation."
```

## Poetry Generation Prompts

### Template Structure

```typescript
const buildPoetryPrompt = (features: AudioFeatures) => {
  return `
[PERSONA CONTEXT]
You are ${persona}, ${description}. Write ONLY the poem in ${language}.

[TEMPLATE FORMAT]
${templateStructure}

[MUSIC CHARACTERISTICS]
- Tempo: ${tempo} BPM (${paceDescription})
- Intensity: ${intensity}% (${intensityDesc}) - THIS IS THE DOMINANT CHARACTERISTIC
- PRIMARY MOOD: ${mood.toUpperCase()} - This should be the dominant feeling
- Energy level: ${energy} (${energyDesc})
- Emotional tone: ${emotionalTone}

[CRITICAL REQUIREMENTS]
1. The poem MUST reflect the PRIMARY MOOD (${mood}) and intensity level
2. Write 400-550 characters (approximately 12-16 lines in Korean)
3. Do not write short poems
4. Output ONLY the poem, nothing else
`;
};
```

### Key Elements

1. **Persona Context**: Establish who the AI is embodying
2. **Template Format**: Provide structure examples
3. **Music Characteristics**: Prioritized audio features
4. **Critical Requirements**: Non-negotiable output specifications

### Common Pitfalls

```typescript
// ❌ Bad: Contradictory signals without priority
"Energy: 0.17 (very soft), Mood: upbeat"
// AI gets confused: soft or upbeat?

// ✅ Good: Clear priority
"PRIMARY MOOD: UPBEAT - This should be the dominant feeling
Intensity: 84% (very intense) - THIS IS THE DOMINANT CHARACTERISTIC
Energy level: 0.17 (very calm) - secondary characteristic"
```

## Visualization Configuration Prompts

### JSON Output Requirements

When expecting JSON output:

```typescript
const buildVisualizationPrompt = (analysis: LibrosaAnalysis) => {
  return `
You are a visualization designer. Generate visualization parameters.

Music Analysis:
- PRIMARY MOOD: ${analysis.mood.toUpperCase()}
- Intensity: ${analysis.intensity}
- Tempo: ${analysis.tempo} BPM

CRITICAL: Generate parameters in this EXACT JSON format. 
Output ONLY valid JSON, no additional text, no thinking, no explanation:

{
  "gradient": { "colors": ["#RRGGBB", "#RRGGBB"], "speed": 1.0 },
  "equalizer": { "barCount": 64, "colors": ["#RRGGBB"], "smoothing": 0.7 },
  "spotlight": { "count": 5, "colors": ["#RRGGBB"], "speed": 1.0, "radius": [40, 80] }
}

Guidelines (reflect PRIMARY MOOD):
- High energy → vibrant colors, faster speed
- Low energy → cool colors, slower speed

IMPORTANT: Return ONLY the complete JSON object above. No thinking, no explanation.
`;
};
```

### JSON Parsing Strategy

```typescript
// ✅ Good: Robust JSON extraction
const parseAIResponse = (response: string) => {
  // 1. Check for empty response
  if (!response || response.trim() === '') {
    throw new Error('Empty response');
  }

  // 2. Extract JSON (AI might add thinking/explanation)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found');
  }

  // 3. Parse and validate
  const config = JSON.parse(jsonMatch[0]);
  
  // 4. Validate required fields
  if (!config.gradient || !config.equalizer) {
    throw new Error('Incomplete configuration');
  }

  return config;
};
```

## Token Management

### Token Allocation by Task

| Task | Base Tokens | Thinking Model | Reasoning |
|------|-------------|----------------|-----------|
| Short poem | 150 | 300 | Thinking overhead |
| Medium poem | 400 | 800 | Thinking overhead |
| Long poem | 800 | 1500 | Thinking overhead |
| JSON config | 500 | 800 | Thinking overhead |

### Temperature Settings

```typescript
// Poetry generation
temperature: 0.7  // Creative but controlled

// JSON generation
temperature: 0.3  // Consistent, structured output

// Dramatic poetry
temperature: 0.9  // More creative

// Calm poetry
temperature: 0.6  // More focused
```

## Error Handling & Fallbacks

### Always Provide Fallbacks

```typescript
// ✅ Good: Graceful degradation
async generatePoetry(features: AudioFeatures): Promise<string> {
  try {
    const poetry = await aiProvider.generate(prompt, options);
    
    // Check for empty/invalid response
    if (!poetry || poetry.trim() === '') {
      console.warn('Empty AI response, using template');
      return this.generateFromTemplate(features);
    }
    
    return poetry;
  } catch (error) {
    console.error('AI generation failed:', error);
    return this.generateFromTemplate(features);
  }
}
```

### Template Fallbacks

Ensure template fallbacks are:
1. **Same language** as expected AI output
2. **Same length** as target (400-550 characters for Korean)
3. **Mood-appropriate** based on audio features

```typescript
// ✅ Good: Comprehensive Korean templates
const TEMPLATES = {
  upbeat: [
    '경쾌한 리듬이 발걸음을 재촉하고\n밝은 멜로디가 마음을 들뜨게 한다\n...',
    // ~400-500 characters
  ],
  // ... more moods
};
```

## Testing AI Prompts

### Manual Testing Checklist

1. **Empty Response**: Does it handle empty/null responses?
2. **Short Response**: Does it detect responses that are too short?
3. **Malformed JSON**: Does it extract JSON from text?
4. **Contradictory Features**: Does it prioritize correctly?
5. **Token Limit**: Does it complete within token limits?

### Example Test

```typescript
// Test with contradictory features
const testFeatures = {
  tempo: 108,
  energy: 0.17,      // Very low
  intensity: 0.84,   // Very high
  mood: 'upbeat',    // Positive
  valence: 0.65,
};

// Expected: Poem should be upbeat (PRIMARY MOOD) and intense
// Not: Calm (from low energy)
```

## Model-Specific Considerations

### Qwen3 (Thinking Model)
- **Issue**: Spends tokens on thinking, may return empty response
- **Solution**: Increase token limits, add "no thinking" instruction
- **Alternative**: Use non-thinking models (Gemma3, Mistral)

### Gemma3:4b
- **Issue**: May generate very short outputs
- **Solution**: Explicit length requirements, examples
- **Strength**: Fast, consistent

### Claude (Bedrock)
- **Strength**: Follows instructions well, good at poetry
- **Consideration**: Higher cost, requires AWS credentials

### OpenAI GPT
- **Strength**: Excellent at creative tasks
- **Consideration**: Requires API key, rate limits

## Best Practices Summary

1. ✅ **Be explicit** about output format and length
2. ✅ **Emphasize** critical requirements with CAPS/markers
3. ✅ **Prioritize** contradictory audio features clearly
4. ✅ **Increase tokens** for thinking models
5. ✅ **Provide fallbacks** for all AI operations
6. ✅ **Validate** AI responses before using
7. ✅ **Log** failures for debugging
8. ✅ **Test** with edge cases

## References

- Poetry Generation: `src/services/PoetryGenerator.ts`
- Visualization Config: `src/services/VisualizationConfigGenerator.ts`
- Persona Templates: `src/config/personaTemplates.ts`
- Template Fallbacks: `src/services/TemplateFallbackProvider.ts`

---

**Last Updated**: 2025-11-27
**Maintainer**: Development Team
