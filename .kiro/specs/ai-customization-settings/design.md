# Design Document

## Overview

The AI Customization Settings feature enhances the Music Poetry Canvas application by providing users with comprehensive control over poetry generation. This includes persona selection, language preferences, AI provider configuration, and model selection. The design emphasizes user experience through a centralized settings panel while maintaining the application's modular architecture.

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                     App Component                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Settings Panel (Modal)                │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Persona Selector                           │  │  │
│  │  │  Language Selector                          │  │  │
│  │  │  AI Provider Selector (Ollama/OpenAI)      │  │  │
│  │  │  Model Selector (conditional)               │  │  │
│  │  │  API Key Input (conditional)                │  │  │
│  │  │  [Save] [Cancel]                            │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Poetry Display Component                │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Current Poem                               │  │  │
│  │  │  [Regenerate Poetry] Button                 │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │      Visualization Canvas Component               │  │
│  │  Mode Selector: [Gradient] [Equalizer]           │  │
│  │                 [Spotlight] [Combined]            │  │
│  │  (AI Image mode removed)                          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (Settings) → Settings Store → Poetry Generator → AI Provider
                              ↓
                      localStorage (persistence)
```

## Components and Interfaces

### 1. Settings Store (Zustand)

```typescript
interface AISettings {
  persona: Persona;
  language: Language;
  provider: 'ollama' | 'openai';
  ollamaModel: string;
  openaiApiKey: string | null;
}

interface SettingsStore {
  settings: AISettings;
  updateSettings: (partial: Partial<AISettings>) => void;
  loadSettings: () => void;
  saveSettings: () => void;
  resetToDefaults: () => void;
}
```

### 2. Settings Panel Component

```typescript
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Uses shadcn/ui components:
// - Dialog for modal
// - Select for dropdowns
// - Input for API key
// - Button for actions
```

### 3. Poetry Generator Service (Enhanced)

```typescript
interface PoetryGeneratorConfig {
  persona: Persona;
  language: Language;
  provider: 'ollama' | 'openai';
  model?: string;
  apiKey?: string;
}

class PoetryGenerator {
  async generate(
    audioFeatures: AudioFeatures,
    config: PoetryGeneratorConfig
  ): Promise<string>;
  
  private buildPrompt(
    audioFeatures: AudioFeatures,
    persona: Persona,
    language: Language
  ): string;
}
```

### 4. Backend API Extensions

```typescript
// New endpoint
GET /api/ollama/models
Response: { models: Array<{ name: string, size: string }> }

// Enhanced endpoint
POST /api/poetry/generate
Request: {
  audioFeatures: AudioFeatures,
  persona: string,
  language: string,
  provider: 'ollama' | 'openai',
  model?: string,
  apiKey?: string
}
Response: { poetry: string }
```

## Data Models

### Persona Type

```typescript
type Persona = 
  | 'hamlet'
  | 'nietzsche'
  | 'yi-sang'
  | 'baudelaire'
  | 'rimbaud'
  | 'kim-soo-young'
  | 'yun-dong-ju'
  | 'edgar-allan-poe'
  | 'oscar-wilde'
  | 'kafka'
  | 'baek-seok';

interface PersonaDefinition {
  id: Persona;
  name: string;
  nameKo: string;
  description: string;
  style: string;
  promptModifier: string;
}
```

### Language Type

```typescript
type Language = 
  | 'ko'  // Korean
  | 'en'  // English
  | 'ja'  // Japanese
  | 'zh'  // Chinese
  | 'fr'  // French
  | 'de'  // German
  | 'es'; // Spanish

interface LanguageDefinition {
  code: Language;
  name: string;
  nativeName: string;
}
```

### Settings Storage

```typescript
interface StoredSettings {
  version: string; // For migration
  persona: Persona;
  language: Language;
  provider: 'ollama' | 'openai';
  ollamaModel: string;
  openaiApiKey: string | null; // Encrypted
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Persona selection updates prompt

*For any* persona selection, the poetry generation prompt should include that persona's specific characteristics and style modifiers.

**Validates: Requirements 1.2, 1.3**

### Property 2: Regeneration uses current audio data

*For any* poetry regeneration request, the audio features passed to the generator should match the currently loaded audio analysis data.

**Validates: Requirements 2.2**

### Property 3: Poem history grows on successful regeneration

*For any* successful poetry regeneration, the poem history list length should increase by exactly one.

**Validates: Requirements 2.4**

### Property 4: Failed regeneration preserves previous poem

*For any* poetry generation failure, the currently displayed poem should remain unchanged from before the regeneration attempt.

**Validates: Requirements 2.5**

### Property 5: Visualization modes exclude AI Image

*For any* visualization mode selection, the selected mode must be one of: Gradient, Equalizer, Spotlight, or Combined (never AI Image).

**Validates: Requirements 3.2**

### Property 6: Model list displays all retrieved models

*For any* list of Ollama models returned from the API, all models should appear as options in the dropdown selector.

**Validates: Requirements 4.2**

### Property 7: Model selection updates configuration

*For any* Ollama model selection, subsequent poetry generation requests should use that selected model.

**Validates: Requirements 4.3**

### Property 8: API key validation and storage

*For any* OpenAI API key input, the key should be validated for correct format before being stored in localStorage.

**Validates: Requirements 5.3**

### Property 9: OpenAI provider uses correct API

*For any* poetry generation request when OpenAI is the selected provider, the OpenAI API should be called with the configured API key.

**Validates: Requirements 5.4**

### Property 10: Language selection updates prompt

*For any* language selection, the poetry generation prompt should explicitly request output in that language.

**Validates: Requirements 6.2, 6.3**

### Property 11: Settings modification enables save button

*For any* change to settings values, the save button should transition from disabled to enabled state.

**Validates: Requirements 7.3**

### Property 12: Save persists and applies settings

*For any* settings save action, the values should be stored in localStorage and immediately applied to the application state.

**Validates: Requirements 7.4**

### Property 13: Cancel reverts to previous settings

*For any* settings panel close without save, the settings values should revert to their state before the panel was opened.

**Validates: Requirements 7.5**

### Property 14: Settings round-trip consistency

*For any* valid settings object, saving to localStorage then loading should return an equivalent settings object.

**Validates: Requirements 8.1**

### Property 15: API key encryption

*For any* OpenAI API key stored in localStorage, the stored value should be encrypted (not equal to the plaintext key).

**Validates: Requirements 8.5**

## Error Handling

### Settings Panel Errors

1. **Ollama Unavailable**
   - Display: "Cannot connect to Ollama. Please ensure Ollama is running."
   - Action: Disable model selector, suggest checking Ollama service

2. **Invalid OpenAI API Key**
   - Display: "Invalid API key format. Please check your key."
   - Action: Prevent save, highlight input field

3. **API Key Authentication Failed**
   - Display: "API key authentication failed. Please verify your key."
   - Action: Allow retry, suggest checking OpenAI dashboard

4. **Settings Load Failure**
   - Display: "Failed to load settings. Using defaults."
   - Action: Reset to defaults, log error for debugging

### Poetry Generation Errors

1. **Provider Unavailable**
   - Display: "AI service unavailable. Please try again."
   - Action: Retry button, fallback to template if configured

2. **Generation Timeout**
   - Display: "Poetry generation timed out. Please try again."
   - Action: Retry button, consider reducing prompt complexity

3. **Invalid Configuration**
   - Display: "Invalid AI configuration. Please check settings."
   - Action: Open settings panel, highlight problematic field

## Testing Strategy

### Unit Tests

1. **Settings Store**
   - Test default values initialization
   - Test settings update logic
   - Test localStorage save/load
   - Test encryption/decryption of API key

2. **Persona Definitions**
   - Test all personas have required fields
   - Test prompt modifier application
   - Test persona name localization

3. **Language Definitions**
   - Test all languages have required fields
   - Test language code validation

4. **Poetry Generator**
   - Test prompt building with different personas
   - Test prompt building with different languages
   - Test provider switching logic

### Property-Based Tests

Property-based tests will use **fast-check** library with a minimum of 100 iterations per test.

1. **Property 1: Persona selection updates prompt**
   - Generator: Random persona from available list
   - Property: Generated prompt contains persona-specific keywords
   - Tag: `**Feature: ai-customization-settings, Property 1: Persona selection updates prompt**`

2. **Property 2: Regeneration uses current audio data**
   - Generator: Random audio features
   - Property: Regeneration call receives same audio features as current analysis
   - Tag: `**Feature: ai-customization-settings, Property 2: Regeneration uses current audio data**`

3. **Property 3: Poem history grows on successful regeneration**
   - Generator: Random initial poem count
   - Property: After successful regeneration, count increases by 1
   - Tag: `**Feature: ai-customization-settings, Property 3: Poem history grows on successful regeneration**`

4. **Property 4: Failed regeneration preserves previous poem**
   - Generator: Random poem text
   - Property: After failed regeneration, poem text unchanged
   - Tag: `**Feature: ai-customization-settings, Property 4: Failed regeneration preserves previous poem**`

5. **Property 5: Visualization modes exclude AI Image**
   - Generator: Random mode selection
   - Property: Selected mode is never "ai-image"
   - Tag: `**Feature: ai-customization-settings, Property 5: Visualization modes exclude AI Image**`

6. **Property 6: Model list displays all retrieved models**
   - Generator: Random list of model names
   - Property: All model names appear in dropdown options
   - Tag: `**Feature: ai-customization-settings, Property 6: Model list displays all retrieved models**`

7. **Property 7: Model selection updates configuration**
   - Generator: Random model name
   - Property: After selection, config.model equals selected model
   - Tag: `**Feature: ai-customization-settings, Property 7: Model selection updates configuration**`

8. **Property 8: API key validation and storage**
   - Generator: Random strings (valid and invalid API key formats)
   - Property: Only valid format keys are stored
   - Tag: `**Feature: ai-customization-settings, Property 8: API key validation and storage**`

9. **Property 9: OpenAI provider uses correct API**
   - Generator: Random API key
   - Property: When provider is OpenAI, OpenAI API is called with key
   - Tag: `**Feature: ai-customization-settings, Property 9: OpenAI provider uses correct API**`

10. **Property 10: Language selection updates prompt**
    - Generator: Random language from available list
    - Property: Generated prompt contains language instruction
    - Tag: `**Feature: ai-customization-settings, Property 10: Language selection updates prompt**`

11. **Property 11: Settings modification enables save button**
    - Generator: Random settings changes
    - Property: After any change, save button is enabled
    - Tag: `**Feature: ai-customization-settings, Property 11: Settings modification enables save button**`

12. **Property 12: Save persists and applies settings**
    - Generator: Random valid settings object
    - Property: After save, localStorage contains settings and app state matches
    - Tag: `**Feature: ai-customization-settings, Property 12: Save persists and applies settings**`

13. **Property 13: Cancel reverts to previous settings**
    - Generator: Random initial settings and random changes
    - Property: After cancel, settings equal initial values
    - Tag: `**Feature: ai-customization-settings, Property 13: Cancel reverts to previous settings**`

14. **Property 14: Settings round-trip consistency**
    - Generator: Random valid settings object
    - Property: save(settings) then load() returns equivalent settings
    - Tag: `**Feature: ai-customization-settings, Property 14: Settings round-trip consistency**`

15. **Property 15: API key encryption**
    - Generator: Random API key strings
    - Property: Stored value !== plaintext key
    - Tag: `**Feature: ai-customization-settings, Property 15: API key encryption**`

### Integration Tests

1. **Settings Panel Flow**
   - Open settings → Modify values → Save → Verify persistence
   - Open settings → Modify values → Cancel → Verify revert

2. **Poetry Regeneration Flow**
   - Load audio → Generate poetry → Regenerate → Verify new poem

3. **Provider Switching Flow**
   - Configure Ollama → Generate → Switch to OpenAI → Generate → Verify different providers used

4. **Persona and Language Combination**
   - Select persona → Select language → Generate → Verify both applied to prompt

## Performance Considerations

1. **Settings Load Time**: < 50ms from localStorage
2. **Model List Fetch**: < 500ms from Ollama API
3. **Settings Save Time**: < 100ms to localStorage
4. **Encryption/Decryption**: < 10ms for API key

## Security Considerations

1. **API Key Storage**
   - Use Web Crypto API for encryption
   - Never log API keys
   - Clear from memory after use

2. **Input Validation**
   - Sanitize all user inputs
   - Validate API key format before storage
   - Validate model names from API

3. **Error Messages**
   - Never expose sensitive data in error messages
   - Generic messages for authentication failures

## Accessibility

1. **Settings Panel**
   - Keyboard navigation support
   - ARIA labels for all form fields
   - Focus management when opening/closing

2. **Regenerate Button**
   - Clear label and tooltip
   - Keyboard accessible
   - Loading state announced to screen readers

3. **Dropdowns**
   - Searchable for long lists
   - Keyboard navigation
   - Clear selected value indication
