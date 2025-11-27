# Implementation Plan

- [x] 1. Create persona and language definitions





  - Create `src/types/persona.ts` with Persona type and PersonaDefinition interface
  - Create `src/types/language.ts` with Language type and LanguageDefinition interface
  - Create `src/config/personas.ts` with all 11 persona definitions (Hamlet, Nietzsche, Yi Sang, Baudelaire, Rimbaud, Kim Soo-young, Yun Dong-ju, Edgar Allan Poe, Oscar Wilde, Kafka, Baek Seok)
  - Create `src/config/languages.ts` with all 7 language definitions (Korean, English, Japanese, Chinese, French, German, Spanish)
  - _Requirements: 1.5, 6.5_

- [ ]* 1.1 Write property test for persona definitions
  - **Property 1: Persona selection updates prompt**
  - **Validates: Requirements 1.2, 1.3**

- [x] 2. Create settings store with Zustand





  - Create `src/stores/settingsStore.ts` with AISettings interface
  - Implement default values (Hamlet, Korean, Ollama, gemma3:4b)
  - Implement updateSettings, loadSettings, saveSettings, resetToDefaults methods
  - Add localStorage persistence logic
  - Add API key encryption/decryption using Web Crypto API
  - _Requirements: 8.1, 8.3, 8.5_

- [ ]* 2.1 Write property test for settings round-trip
  - **Property 14: Settings round-trip consistency**
  - **Validates: Requirements 8.1**

- [ ]* 2.2 Write property test for API key encryption
  - **Property 15: API key encryption**
  - **Validates: Requirements 8.5**

- [x] 3. Update PoetryGenerator service




  - Modify `src/services/PoetryGenerator.ts` to accept PoetryGeneratorConfig
  - Update buildPrompt method to include persona characteristics
  - Update buildPrompt method to include language instruction
  - Add provider switching logic (Ollama vs OpenAI)
  - _Requirements: 1.2, 1.3, 6.2, 6.3, 5.4_

- [ ]* 3.1 Write property test for language selection
  - **Property 10: Language selection updates prompt**
  - **Validates: Requirements 6.2, 6.3**

- [x] 4. Create Settings Panel UI component





  - Create `src/components/SettingsPanel.tsx` using shadcn/ui Dialog
  - Add persona selector using shadcn/ui Select
  - Add language selector using shadcn/ui Select
  - Add AI provider selector (Ollama/OpenAI) using shadcn/ui Toggle Group
  - Add conditional Ollama model selector
  - Add conditional OpenAI API key input using shadcn/ui Input
  - Add Save and Cancel buttons using shadcn/ui Button
  - Implement form state management and validation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 4.1 Write property test for settings modification
  - **Property 11: Settings modification enables save button**
  - **Validates: Requirements 7.3**

- [ ]* 4.2 Write property test for save action
  - **Property 12: Save persists and applies settings**
  - **Validates: Requirements 7.4**

- [ ]* 4.3 Write property test for cancel action
  - **Property 13: Cancel reverts to previous settings**
  - **Validates: Requirements 7.5**

- [x] 5. Add settings button to App header





  - Add settings icon button to header in `src/App.tsx`
  - Implement modal open/close state management
  - Integrate SettingsPanel component
  - _Requirements: 7.1_

- [x] 6. Add regenerate poetry button





  - Update `src/components/PoetryDisplay.tsx` to include regenerate button
  - Add loading state indicator during regeneration
  - Implement regeneration logic using current audio analysis data
  - Handle regeneration errors gracefully
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 6.1 Write property test for regeneration
  - **Property 2: Regeneration uses current audio data**
  - **Validates: Requirements 2.2**

- [ ]* 6.2 Write property test for poem history growth
  - **Property 3: Poem history grows on successful regeneration**
  - **Validates: Requirements 2.4**

- [ ]* 6.3 Write property test for failed regeneration
  - **Property 4: Failed regeneration preserves previous poem**
  - **Validates: Requirements 2.5**

- [x] 7. Remove AI Image visualization mode





  - Update `src/types/visualization.ts` to remove 'ai-image' from VisualizationMode type
  - Remove AI Image option from mode selector in `src/components/VisualizationCanvas.tsx`
  - Remove AI Image visualization implementation from `src/core/visualizations/`
  - Update any references to AI Image mode throughout codebase
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 7.1 Write property test for visualization modes
  - **Property 5: Visualization modes exclude AI Image**
  - **Validates: Requirements 3.2**

- [x] 8. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create backend endpoint for Ollama models





  - Create `GET /api/ollama/models` endpoint in `backend/server.js`
  - Implement Ollama API call to fetch model list
  - Handle Ollama unavailable errors (503)
  - Return formatted model list
  - _Requirements: 9.1, 9.4, 9.5_

- [x] 10. Enhance backend poetry generation endpoint





  - Update `POST /api/poetry/generate` in `backend/server.js`
  - Add support for persona, language, provider, model, apiKey parameters
  - Implement OpenAI API integration
  - Handle invalid API key errors (401)
  - Route requests to appropriate provider (Ollama or OpenAI)
  - _Requirements: 9.2, 9.3_

- [x] 11. Create Ollama model fetching hook




  - Create `src/hooks/useOllamaModels.ts`
  - Implement model list fetching from backend
  - Handle loading and error states
  - Cache model list to avoid repeated fetches
  - _Requirements: 4.1, 4.4_

- [ ]* 11.1 Write property test for model list display
  - **Property 6: Model list displays all retrieved models**
  - **Validates: Requirements 4.2**
-

- [x] 12. Integrate settings with poetry generation



  - Update `src/hooks/usePoetryGenerator.ts` to use settings from store
  - Pass persona, language, provider, model, apiKey to PoetryGenerator
  - Update all poetry generation calls throughout app
  - _Requirements: 1.2, 1.3, 4.3, 5.4, 6.2, 6.3_

- [ ]* 12.1 Write property test for model selection
  - **Property 7: Model selection updates configuration**
  - **Validates: Requirements 4.3**

- [ ]* 12.2 Write property test for OpenAI provider
  - **Property 9: OpenAI provider uses correct API**
  - **Validates: Requirements 5.4**
-

- [x] 13. Add API key validation




  - Create `src/utils/validation.ts` with API key format validation
  - Implement validation in SettingsPanel before save
  - Display validation errors to user
  - _Requirements: 5.3_

- [ ]* 13.1 Write property test for API key validation
  - **Property 8: API key validation and storage**
  - **Validates: Requirements 5.3**

- [x] 14. Initialize settings on app load





  - Update `src/App.tsx` to load settings from store on mount
  - Apply loaded settings to poetry generator
  - Handle corrupted settings gracefully
  - _Requirements: 8.2, 8.4_

- [x] 15. Add error handling and user feedback





  - Implement error toast notifications using shadcn/ui Toast
  - Add error boundaries for settings panel
  - Display appropriate error messages for all failure scenarios
  - _Requirements: 2.5, 4.4, 5.5, 8.4_

- [x] 16. Final checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Update documentation



  - Update README.md with new features (persona selection, language options, provider configuration)
  - Update README.ko.md with Korean translations
  - Add screenshots of settings panel
  - Document OpenAI API key setup process
