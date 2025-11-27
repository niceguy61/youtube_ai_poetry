# Requirements Document

## Introduction

This feature adds comprehensive AI customization capabilities to the Music Poetry Canvas application, allowing users to personalize their poetry generation experience through persona selection, model configuration, and API provider choices.

## Glossary

- **System**: The Music Poetry Canvas web application
- **User**: A person interacting with the application
- **Persona**: A literary or philosophical character whose voice/style is used for poetry generation
- **AI Provider**: The backend service used for text generation (Ollama or OpenAI)
- **Poetry Regeneration**: The process of generating a new poem for the currently loaded music
- **Settings Panel**: A UI component for configuring AI-related options
- **Ollama Model**: A locally-run AI model available through Ollama
- **OpenAI API**: OpenAI's cloud-based text generation service

## Requirements

### Requirement 1: Persona Selection

**User Story:** As a user, I want to select different literary personas for poetry generation, so that I can experience diverse poetic styles and perspectives.

#### Acceptance Criteria

1. WHEN the user opens the settings panel THEN the System SHALL display a list of available personas
2. WHEN the user selects a persona THEN the System SHALL update the poetry generation prompt to reflect that persona's voice and style
3. WHEN poetry is generated THEN the System SHALL use the selected persona's characteristics in the AI prompt
4. WHEN no persona is explicitly selected THEN the System SHALL default to Hamlet as the persona
5. THE System SHALL support at least 10 distinct personas including: Hamlet, Nietzsche, Yi Sang (이상), Baudelaire, Rimbaud, Kim Soo-young (김수영), Yun Dong-ju (윤동주), Edgar Allan Poe, Oscar Wilde, and Kafka

### Requirement 2: Poetry Regeneration

**User Story:** As a user, I want to regenerate poetry for the current music, so that I can explore different poetic interpretations of the same audio.

#### Acceptance Criteria

1. WHEN audio is loaded and analyzed THEN the System SHALL display a regenerate button
2. WHEN the user clicks the regenerate button THEN the System SHALL generate a new poem using the current audio analysis data
3. WHEN regeneration is in progress THEN the System SHALL display a loading indicator
4. WHEN regeneration completes THEN the System SHALL display the new poem and add it to the poem history
5. WHEN regeneration fails THEN the System SHALL display an error message and retain the previous poem

### Requirement 3: Visualization Mode Management

**User Story:** As a user, I want a streamlined visualization mode selection, so that I can focus on working visualization options.

#### Acceptance Criteria

1. WHEN the visualization mode selector is displayed THEN the System SHALL exclude the "AI Image" mode option
2. WHEN the user switches visualization modes THEN the System SHALL only allow selection from: Gradient, Equalizer, Spotlight, and Combined modes
3. WHEN the application initializes THEN the System SHALL not attempt to load or initialize AI Image visualization mode

### Requirement 4: Ollama Model Selection

**User Story:** As a user, I want to select which Ollama model to use for poetry generation, so that I can experiment with different model capabilities and performance characteristics.

#### Acceptance Criteria

1. WHEN the settings panel opens THEN the System SHALL fetch the list of available Ollama models from the local Ollama instance
2. WHEN Ollama models are retrieved THEN the System SHALL display them in a dropdown selector
3. WHEN the user selects an Ollama model THEN the System SHALL update the configuration to use that model for subsequent poetry generation
4. WHEN Ollama is unavailable THEN the System SHALL display an appropriate error message and disable model selection
5. WHEN no model is explicitly selected THEN the System SHALL default to "gemma3:4b"

### Requirement 5: OpenAI API Integration

**User Story:** As a user, I want to use OpenAI's API for poetry generation, so that I can leverage cloud-based models when local resources are limited.

#### Acceptance Criteria

1. WHEN the settings panel opens THEN the System SHALL provide an option to select between Ollama and OpenAI as the AI provider
2. WHEN OpenAI is selected as the provider THEN the System SHALL display an API key input field
3. WHEN the user enters an OpenAI API key THEN the System SHALL validate the key format and store it securely in browser storage
4. WHEN poetry generation is requested with OpenAI selected THEN the System SHALL use the OpenAI API with the provided key
5. WHEN OpenAI API calls fail THEN the System SHALL display an error message and optionally fall back to Ollama if available

### Requirement 6: Poetry Language Selection

**User Story:** As a user, I want to select the language for poetry generation, so that I can enjoy poems in my preferred language.

#### Acceptance Criteria

1. WHEN the settings panel opens THEN the System SHALL display a language selector with available options
2. WHEN the user selects a language THEN the System SHALL update the poetry generation prompt to generate in that language
3. WHEN poetry is generated THEN the System SHALL use the selected language in the AI prompt
4. WHEN no language is explicitly selected THEN the System SHALL default to Korean (한국어)
5. THE System SHALL support at least: Korean (한국어), English, Japanese (日本語), Chinese (中文), French (Français), German (Deutsch), Spanish (Español)

### Requirement 7: Settings Panel UI

**User Story:** As a user, I want a dedicated settings panel for AI configuration, so that I can easily manage all AI-related options in one place.

#### Acceptance Criteria

1. WHEN the user clicks a settings button THEN the System SHALL open a modal or drawer containing all AI configuration options
2. WHEN the settings panel is open THEN the System SHALL display: persona selector, language selector, AI provider selector, model selector (Ollama), API key input (OpenAI), and a save/apply button
3. WHEN the user modifies settings THEN the System SHALL enable the save button
4. WHEN the user clicks save THEN the System SHALL persist settings to browser storage and apply them immediately
5. WHEN the user closes the settings panel without saving THEN the System SHALL revert to previous settings

### Requirement 8: Settings Persistence

**User Story:** As a user, I want my AI settings to be remembered across sessions, so that I don't have to reconfigure them every time I use the application.

#### Acceptance Criteria

1. WHEN the user saves settings THEN the System SHALL store them in browser localStorage
2. WHEN the application loads THEN the System SHALL retrieve and apply saved settings
3. WHEN no saved settings exist THEN the System SHALL use default values (Hamlet persona, Korean language, Ollama provider, gemma3:4b model)
4. WHEN settings are corrupted or invalid THEN the System SHALL fall back to defaults and notify the user
5. THE System SHALL encrypt sensitive data (OpenAI API key) before storing in localStorage

### Requirement 9: Backend API Extensions

**User Story:** As a system administrator, I want the backend to support model listing and provider switching, so that the frontend can offer dynamic configuration options.

#### Acceptance Criteria

1. WHEN the frontend requests available Ollama models THEN the backend SHALL query the Ollama API and return the list
2. WHEN the frontend requests poetry generation with OpenAI THEN the backend SHALL use the OpenAI API with the provided key
3. WHEN the backend receives an invalid API key THEN the backend SHALL return a 401 error with a descriptive message
4. WHEN the backend cannot reach Ollama THEN the backend SHALL return a 503 error indicating service unavailability
5. THE backend SHALL support a new endpoint: GET /api/ollama/models for listing available models
