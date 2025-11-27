# Poetry Generation Endpoint Guide

## Overview

The `/api/poetry/generate` endpoint generates poetry using AI providers (Ollama or OpenAI) based on audio features, persona, and language preferences.

## Endpoint

```
POST /api/poetry/generate
```

## Request Body

```json
{
  "audioFeatures": {
    "tempo": 120,
    "energy": 0.75,
    "mood": "energetic",
    "spectralCentroid": 2000,
    "key": "C major"
  },
  "persona": "hamlet",
  "language": "ko",
  "provider": "ollama",
  "model": "gemma3:4b",
  "apiKey": "sk-..." // Only required for OpenAI
}
```

## Parameters

### Required
- `audioFeatures` (object): Audio analysis data
  - `tempo` (number): BPM
  - `energy` (number): 0-1 scale
  - `mood` (string): Mood description
  - `spectralCentroid` (number, optional): Brightness
  - `key` (string, optional): Musical key

### Optional
- `persona` (string): Literary persona (default: "hamlet")
  - Options: hamlet, nietzsche, yi-sang, baudelaire, rimbaud, kim-soo-young, yun-dong-ju, edgar-allan-poe, oscar-wilde, kafka, baek-seok
  
- `language` (string): Output language (default: "ko")
  - Options: ko, en, ja, zh, fr, de, es
  
- `provider` (string): AI provider (default: "ollama")
  - Options: ollama, openai
  
- `model` (string): Ollama model name (default: "gemma3:4b")
  - Only used when provider is "ollama"
  
- `apiKey` (string): OpenAI API key
  - Required when provider is "openai"

## Response

### Success (200)
```json
{
  "success": true,
  "poetry": "Generated poem text..."
}
```

### Error Responses

#### 400 - Bad Request
```json
{
  "error": "Audio features are required",
  "message": "Please provide audio analysis data for poetry generation"
}
```

```json
{
  "error": "API key required",
  "message": "OpenAI API key is required when using OpenAI provider"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Invalid API key",
  "message": "The provided OpenAI API key is invalid or unauthorized",
  "details": "..."
}
```

#### 503 - Service Unavailable
```json
{
  "error": "Service unavailable",
  "message": "Cannot connect to Ollama. Please ensure Ollama is running.",
  "details": "..."
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Poetry generation failed",
  "message": "..."
}
```

## Examples

### Example 1: Ollama with Hamlet persona in Korean
```bash
curl -X POST http://localhost:3001/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{
    "audioFeatures": {
      "tempo": 120,
      "energy": 0.75,
      "mood": "energetic"
    },
    "persona": "hamlet",
    "language": "ko",
    "provider": "ollama",
    "model": "gemma3:4b"
  }'
```

### Example 2: OpenAI with Nietzsche persona in German
```bash
curl -X POST http://localhost:3001/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{
    "audioFeatures": {
      "tempo": 90,
      "energy": 0.5,
      "mood": "contemplative"
    },
    "persona": "nietzsche",
    "language": "de",
    "provider": "openai",
    "apiKey": "sk-your-api-key-here"
  }'
```

### Example 3: Edgar Allan Poe in English
```bash
curl -X POST http://localhost:3001/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{
    "audioFeatures": {
      "tempo": 60,
      "energy": 0.3,
      "mood": "dark"
    },
    "persona": "edgar-allan-poe",
    "language": "en",
    "provider": "ollama"
  }'
```

## Testing

Run the test script:
```bash
node test-poetry-endpoint.js
```

This will test:
1. Missing audio features (400 error)
2. Ollama provider with valid data
3. OpenAI without API key (400 error)
4. OpenAI with invalid API key (401 error)
5. Different persona and language combinations

## Implementation Details

### Persona Styles
Each persona has a unique style modifier that influences the poetry generation:
- **Hamlet**: Contemplative, melancholic, existential
- **Nietzsche**: Bold, philosophical, challenging
- **Yi Sang**: Surreal, modernist, fragmented
- **Baudelaire**: Decadent, symbolist, beauty and darkness
- **Rimbaud**: Rebellious, visionary, vivid sensory
- **Kim Soo-young**: Socially conscious, modern
- **Yun Dong-ju**: Pure, introspective, gentle melancholy
- **Edgar Allan Poe**: Dark, gothic, haunting
- **Oscar Wilde**: Witty, aesthetic, paradoxical
- **Kafka**: Absurdist, alienated, isolated
- **Baek Seok**: Pastoral, nostalgic, rural

### Language Support
The endpoint supports 7 languages with proper instructions:
- Korean (한국어)
- English
- Japanese (日本語)
- Chinese (中文)
- French (Français)
- German (Deutsch)
- Spanish (Español)

### Provider Routing
- **Ollama**: Uses local Ollama instance at `OLLAMA_ENDPOINT` (default: http://localhost:11434)
- **OpenAI**: Uses OpenAI API with gpt-3.5-turbo model

## Environment Variables

```bash
OLLAMA_ENDPOINT=http://localhost:11434  # Ollama API endpoint
```

## Error Handling

The endpoint handles:
1. Missing required parameters (400)
2. Invalid OpenAI API keys (401)
3. Service unavailability for both providers (503)
4. Network errors and timeouts (500)
5. Malformed requests (400)

All errors include descriptive messages to help with debugging.
