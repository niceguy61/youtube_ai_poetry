# Implementation Plan

- [x] 1. Set up project structure and core infrastructure





  - Initialize React + TypeScript + Vite project
  - Configure Tailwind CSS for styling
  - Set up Zustand for state management
  - Install testing dependencies (Vitest, fast-check)
  - Create directory structure: src/{components, core, services, utils, types, config, hooks}
  - Configure environment variables for AI providers
  - _Requirements: 5.1, 10.1_

- [ ]* 1.1 Write property test for project configuration
  - **Property 22: Configuration-based provider switching**
  - **Validates: Requirements 11.6**

- [x] 2. Implement Duration Validator service




  - Create DurationValidator class with validate() method
  - Implement 5-minute (300 seconds) limit check
  - Return ValidationResult with isValid, duration, and message
  - _Requirements: 1.4, 1.5, 1.6_

- [ ]* 2.1 Write property test for duration validation
  - **Property 3: Duration boundary validation**
  - **Validates: Requirements 1.4, 1.5, 1.6**

- [x] 3. Implement Audio Manager core




  - Create AudioManager class with Web Audio API integration
  - Implement loadFromFile() for MP3/OGG file handling
  - Implement loadFromURL() for public web URLs
  - Add playback controls: play(), pause(), stop(), seek()
  - Implement event subscriptions: onPlaybackStateChange(), onTimeUpdate()
  - Integrate DurationValidator before processing
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ]* 3.1 Write property test for file format validation
  - **Property 1: File format validation**
  - **Validates: Requirements 1.1**

- [ ]* 3.2 Write property test for URL validation
  - **Property 2: URL validation and fetching**
  - **Validates: Requirements 1.2**

- [ ]* 3.3 Write unit tests for Audio Manager
  - Test playback state transitions
  - Test event emission timing
  - Test error handling for invalid files
-

- [x] 4. Implement YouTube Extractor service



  - Create YouTubeExtractor class
  - Implement isValidYouTubeURL() with regex patterns
  - Implement extractAudio() using backend proxy or serverless function
  - Implement getVideoInfo() for metadata extraction
  - Add error handling for extraction failures
  - _Requirements: 1.3_


- [x]* 4.1 Write unit tests for YouTube URL validation




  - Test various YouTube URL formats
  - https://www.youtube.com/watch?v=zMyHqip2wfo&list=RDGMEMTmC-2iNKH_l8gQ1LHo9FeQ&start_radio=1 (less 5min)
  - https://www.youtube.com/watch?v=av9ckvRxnNs&list=RDATgy&start_radio=1 (much 5 min)
  - Test invalid URL rejection

- [x] 5. Implement Audio Analyzer service




  - Create AudioAnalyzer class using Web Audio API AnalyserNode
  - Implement initialize() to connect audio source
  - Implement getFrequencyData() and getTimeDomainData()
  - Implement BPM detection algorithm
  - Implement energy calculation (RMS)
  - Implement extractFeatures() for AI (tempo, energy, spectral features, MFCC)
  - _Requirements: 2.2, 3.1_

- [ ]* 5.1 Write unit tests for audio feature extraction
  - Test BPM calculation with known audio samples
  - Test energy calculation accuracy
  - Test feature extraction completeness

- [x] 6. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Visualization Engine core




  - Create VisualizationEngine class
  - Implement initialize() with canvas context setup
  - Implement render() method with RequestAnimationFrame loop
  - Create base rendering pipeline
  - Implement setMode() for visualization mode switching
  - Implement layer management: enableLayer(), disableLayer()
  - _Requirements: 2.1, 2.3, 12.6_

- [ ]* 7.1 Write property test for audio-visual synchronization
  - **Property 4: Audio-visual synchronization**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 7.2 Write property test for playback state preservation
  - **Property 5: Playback state preservation**
  - **Validates: Requirements 2.4, 2.5**

- [ ]* 7.3 Write property test for visualization mode switching
  - **Property 25: Visualization mode switching continuity**
  - **Validates: Requirements 12.6**

- [x] 8. Implement Gradient visualization mode




  - Create GradientVisualization class implementing VisualizationMode interface
  - Implement BPM-synchronized gradient animation
  - Calculate animation phase based on BPM timing
  - Implement smooth color transitions
  - Support configurable color schemes
  - _Requirements: 2.7, 12.2_

- [ ]* 8.1 Write property test for BPM synchronization
  - **Property 6: BPM synchronization**
  - **Validates: Requirements 2.7**

- [x] 9. Implement Equalizer visualization mode





  - Create EqualizerVisualization class
  - Implement frequency bar rendering
  - Calculate bar heights from frequency data
  - Implement smoothing algorithm
  - Add color gradient support
  - Overlay on existing background
  - _Requirements: 2.8, 12.3_

- [ ]* 9.1 Write property test for equalizer responsiveness
  - **Property 7: Equalizer responsiveness**
  - **Validates: Requirements 2.8**

- [x] 10. Implement Spotlight visualization mode




  - Create SpotlightVisualization class
  - Implement animated spotlight effects
  - Synchronize spotlight movement with rhythm
  - Support background image loading
  - Implement light intensity controls
  - _Requirements: 12.4_

- [x] 11. Implement AI Image visualization mode





  - Create AIImageVisualization class
  - Integrate with AI provider for image generation
  - Implement image loading and caching
  - Add opacity and blend mode controls
  - Handle generation failures gracefully
  - _Requirements: 12.5_

- [ ]* 11.1 Write property test for visualization layer composition
  - **Property 26: Visualization layer composition**
  - **Validates: Requirements 12.7**

- [x] 12. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement AI Provider Service abstraction





  - Create AIProviderService interface
  - Implement provider configuration loading from environment
  - Create OllamaProvider implementation
  - Create BedrockProvider implementation
  - Implement generate() and generateStream() methods
  - Add isAvailable() health check
  - Implement checkResources() for GPU verification (Ollama)
  - _Requirements: 3.6, 11.1, 11.2, 11.3_

- [ ]* 13.1 Write property test for provider availability detection
  - **Property 23: Provider availability detection**
  - **Validates: Requirements 11.5**

- [ ]* 13.2 Write property test for resource verification
  - **Property 24: Resource verification**
  - **Validates: Requirements 11.4**

- [x] 14. Implement Poetry Generator




  - Create PoetryGenerator class
  - Implement generateFromAudio() using audio features
  - Implement generateFromMood() for mood-based generation
  - Implement generateFromInteraction() for canvas interactions
  - Build prompt templates for different styles
  - Implement streaming generation with callbacks
  - Add poetry style configuration
  - _Requirements: 3.1, 3.2, 3.4, 4.3_

- [ ]* 14.1 Write property test for poetry generation from audio
  - **Property 8: Poetry generation from audio features**
  - **Validates: Requirements 3.1**

- [ ]* 14.2 Write property test for poetry timing
  - **Property 9: Poetry timing synchronization**
  - **Validates: Requirements 3.2**

- [ ]* 14.3 Write property test for AI provider consistency
  - **Property 11: AI provider output consistency**
  - **Validates: Requirements 3.8**

- [x] 15. Implement template-based poetry fallback




  - Create poetry template library organized by mood
  - Implement template selection based on audio features
  - Create TemplateFallbackProvider class
  - Integrate fallback into PoetryGenerator error handling
  - _Requirements: 8.2_

- [ ]* 15.1 Write property test for AI service fallback
  - **Property 17: AI service fallback**
  - **Validates: Requirements 8.2**

- [x] 16. Implement Canvas Controller




  - Create CanvasController class
  - Implement interaction event handling (click, drag, touch)
  - Implement addElement(), removeElement(), updateElement()
  - Implement hit detection algorithm
  - Implement z-index based element sorting
  - Add interaction event subscriptions
  - _Requirements: 4.1, 4.2, 4.5_

- [ ]* 16.1 Write property test for canvas interaction responsiveness
  - **Property 12: Canvas interaction responsiveness**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 16.2 Write property test for element layering
  - **Property 15: Element layering and interaction priority**
  - **Validates: Requirements 4.5**

- [ ]* 16.3 Write property test for interaction data flow
  - **Property 13: Interaction data flow**
  - **Validates: Requirements 4.3**

- [x] 17. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Implement Storytelling Manager







  - Create StorytellingManager class
  - Implement showIntroduction() with welcome narrative
  - Implement showAnalysisMessage() for processing stages
  - Implement showTransition() for smooth scene changes
  - Implement showGuidanceHint() for user hints
  - Implement showSummary() for experience recap
  - Add narrative style configuration
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 19. Implement Export Manager




  - Create ExportManager class
  - Implement exportPoetry() with format support (txt, json, markdown)
  - Implement exportCanvas() with image format support (png, jpg)
  - Implement exportExperience() for complete data export
  - Implement generateShareURL() with URL encoding
  - Implement loadFromShareURL() with URL decoding
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 19.1 Write property test for poetry export integrity
  - **Property 19: Poetry export integrity**
  - **Validates: Requirements 9.1**

- [ ]* 19.2 Write property test for canvas export integrity
  - **Property 20: Canvas export integrity**
  - **Validates: Requirements 9.2**

- [ ]* 19.3 Write property test for experience sharing round-trip
  - **Property 21: Experience sharing round-trip**
  - **Validates: Requirements 9.3, 9.4**

- [x] 20. Implement Error Handler




  - Create ErrorHandler class
  - Implement classifyError() for error categorization
  - Implement attemptRecovery() with fallback strategies
  - Implement notifyUser() for user-friendly error messages
  - Implement logError() for debugging
  - Add retry logic for network errors (3 attempts)
  - _Requirements: 8.1, 8.3, 8.4, 8.5_

- [ ]* 20.1 Write property test for error message generation
  - **Property 16: Error message generation**
  - **Validates: Requirements 8.1, 8.5**

- [ ]* 20.2 Write property test for network retry logic
  - **Property 18: Network retry logic**
  - **Validates: Requirements 8.4**

- [ ]* 20.3 Write property test for non-blocking visual updates
  - **Property 14: Non-blocking visual updates**
  - **Validates: Requirements 4.4**

- [x] 21. Build React UI components





  - Create AudioInput component with file upload and URL input
  - Create VisualizationCanvas component with mode selector
  - Create PoetryDisplay component with animated text
  - Create InteractiveCanvas component with touch/mouse handling
  - Create ControlPanel component for playback controls
  - Create ExportPanel component for export options
  - Integrate all components in main App component
  - _Requirements: 1.1, 1.2, 2.1, 3.3, 4.1, 9.1, 9.2_

- [x] 22. Implement custom React hooks





  - Create useAudioManager hook for audio state management
  - Create useVisualization hook for visualization state
  - Create usePoetryGenerator hook for poetry generation
  - Create useCanvasController hook for canvas interactions
  - Create useStorytellingManager hook for narrative flow
  - _Requirements: All UI-related requirements_

- [x] 23. Implement configuration system




  - Create config.ts with centralized configuration
  - Load AI provider settings from environment variables
  - Configure audio processing parameters (FFT size, sample rate)
  - Configure visualization settings (FPS, smoothing)
  - Add development vs production environment detection
  - _Requirements: 11.1, 11.6_

- [x] 24. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Implement poetry persistence





  - Add poetry storage in application state
  - Implement poetry history tracking
  - Ensure poems persist after playback ends
  - Add poetry retrieval methods
  - _Requirements: 3.5_

- [ ]* 25.1 Write property test for poetry persistence
  - **Property 10: Poetry persistence**
  - **Validates: Requirements 3.5**

- [x] 26. Wire up complete audio-to-poetry pipeline





  - Connect AudioManager → AudioAnalyzer → PoetryGenerator
  - Implement real-time feature extraction during playback
  - Trigger poetry generation at appropriate intervals
  - Display generated poetry on canvas
  - Handle errors throughout pipeline
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 27. Wire up complete audio-to-visualization pipeline




  - Connect AudioManager → AudioAnalyzer → VisualizationEngine
  - Implement real-time frequency data flow
  - Synchronize visualization with audio timeline
  - Handle pause/resume state transitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 28. Wire up canvas interaction to poetry generation





  - Connect CanvasController → PoetryGenerator
  - Pass interaction data to poetry generation
  - Update poetry based on user interactions
  - Maintain smooth interaction experience
  - _Requirements: 4.3_

- [x] 29. Integrate storytelling throughout experience




  - Add introduction narrative on app load
  - Show analysis messages during processing
  - Display transitions between stages
  - Provide guidance hints during interaction
  - Show summary at experience end
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 30. Implement complete export and sharing flow
  - Wire ExportManager to all data sources
  - Test poetry export in all formats
  - Test canvas image export
  - Test share URL generation and loading
  - Verify data integrity through round-trip
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 31. Add comprehensive error handling
  - Integrate ErrorHandler throughout application
  - Add error boundaries in React components
  - Implement graceful degradation for all features
  - Test all error scenarios
  - Verify user-friendly error messages
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 32. Performance optimization
  - Implement Web Workers for audio analysis
  - Add lazy loading for visualization modes
  - Optimize canvas rendering with dirty rectangles
  - Add caching for AI responses
  - Profile and optimize hot paths
  - _Requirements: Performance targets from design_

- [ ] 33. Accessibility implementation
  - Add keyboard navigation support
  - Implement ARIA labels for all interactive elements
  - Ensure color contrast compliance (WCAG AA)
  - Add prefers-reduced-motion support
  - Test with screen readers
  - _Requirements: Accessibility requirements from design_

- [ ] 34. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 35. Create additional agent hooks
  - Create hook for AI module testing on file save
  - Create hook for canvas interaction testing
  - Create hook for export functionality testing
  - Create hook for running all property tests before commit
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 36. Update steering documents with implementation learnings
  - Document discovered patterns and best practices
  - Add code examples from implementation
  - Update architecture diagrams if needed
  - Document common pitfalls and solutions
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 37. End-to-end integration testing
  - Test complete user flow: upload → visualize → generate poetry → interact → export
  - Test all audio source types (file, URL, YouTube)
  - Test all visualization modes
  - Test both AI providers (Ollama and Bedrock)
  - Test error scenarios and recovery
  - Verify performance targets
