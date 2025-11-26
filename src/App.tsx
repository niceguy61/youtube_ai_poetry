import { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import {
  AudioInput,
  VisualizationCanvas,
  PoetryDisplay,
  StorytellingDisplay,
  MusicInfo,
} from './components';
import { useAudioManager } from './hooks/useAudioManager';
import { useVisualization } from './hooks/useVisualization';
import { usePoetryGenerator } from './hooks/usePoetryGenerator';
import { useStorytellingManager } from './hooks/useStorytellingManager';
import { AudioAnalyzer } from './services/AudioAnalyzer';
import { VisualizationConfigGenerator } from './services/VisualizationConfigGenerator';
import { CONFIG } from './config/config';
import type { AudioFeatures, AudioData } from './types/audio';
import type { VisualizationMode } from './types/visualization';

/**
 * Main App Component
 * 
 * Implements the complete audio-to-poetry pipeline:
 * 1. AudioManager loads and plays audio
 * 2. AudioAnalyzer extracts real-time features (frequency, BPM, energy)
 * 3. PoetryGenerator creates poetry from audio features at regular intervals
 * 4. PoetryDisplay shows generated poetry on canvas
 * 5. Canvas interactions also trigger poetry generation
 * 
 * Requirements: 3.1, 3.2, 3.3 - Complete audio-to-poetry pipeline
 */
function App() {
  // Audio management using custom hook
  const {
    playbackState,
    currentTime,
    duration,
    currentSource,
    isPlaying,
    error: audioError,
    loadFromURL,
    loadFromYouTube,
    play,
    pause,
    stop,
    seek,
    audioManager,
  } = useAudioManager();

  // Visualization management using custom hook
  const {
    currentMode: visualizationMode,
    isInitialized: isVisualizationInitialized,
    isRendering,
    initialize: initializeVisualization,
    setMode: setVisualizationMode,
    setBackgroundImage: setVisualizationBackgroundImage,
    applyAIConfig: applyVisualizationAIConfig,
    startRendering,
    stopRendering,
    updateAudioData,
  } = useVisualization();

  // Poetry state - using the hook for persistence
  const {
    currentPoem,
    poems,
    isGenerating: isGeneratingPoetry,
    generateFromAudio,
  } = usePoetryGenerator();

  // Storytelling management using custom hook
  // Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
  const {
    currentMessage,
    showIntroduction,
    showAnalysisMessage,
    showTransition,
    showGuidanceHint,
    showSummary,
  } = useStorytellingManager('descriptive');

  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ title: string; author?: string; duration?: number } | null>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Overall loading state (audio + analysis + poetry + visualization)
  const [isContentReady, setIsContentReady] = useState(false);
  
  // Track experience data for summary
  const experienceStartTimeRef = useRef<number | null>(null);
  const interactionCountRef = useRef<number>(0);
  const hasShownIntroRef = useRef<boolean>(false);

  // Audio analyzer instance
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Visualization config generator
  const vizConfigGeneratorRef = useRef<VisualizationConfigGenerator | null>(null);



  // Show introduction on app load
  // Requirement 7.1: Present introductory narrative explaining the experience
  useEffect(() => {
    if (!hasShownIntroRef.current) {
      // Show introduction after a brief delay for better UX
      const timer = setTimeout(() => {
        showIntroduction();
        hasShownIntroRef.current = true;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [showIntroduction]);

  // Initialize AudioAnalyzer and VisualizationConfigGenerator on mount
  useEffect(() => {
    if (!audioAnalyzerRef.current) {
      audioAnalyzerRef.current = new AudioAnalyzer();
    }
    
    if (!vizConfigGeneratorRef.current) {
      vizConfigGeneratorRef.current = new VisualizationConfigGenerator();
    }

    return () => {
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.disconnect();
        audioAnalyzerRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Real-time audio analysis and visualization update loop
  // Requirements: 2.1, 2.2, 2.3 - Real-time visualization synchronized with audio
  useEffect(() => {
    // Use isAudioPlaying for HTML5 audio, isPlaying for AudioManager
    const playing = audioUrl ? isAudioPlaying : isPlaying;
    
    if (!playing || !audioAnalyzerRef.current || !isVisualizationInitialized) {
      return;
    }

    let errorCount = 0;
    const MAX_ERRORS = 10; // Stop loop after too many consecutive errors

    const updateLoop = () => {
      const playing = audioUrl ? isAudioPlaying : isPlaying;
      if (!audioAnalyzerRef.current || !playing) {
        return;
      }

      try {
        // Check if AudioAnalyzer is initialized
        if (!audioAnalyzerRef.current.isInitialized()) {
          // Skip this frame if not initialized yet
          animationFrameRef.current = requestAnimationFrame(updateLoop);
          return;
        }
        
        // Get real-time audio data
        const frequencyData = audioAnalyzerRef.current.getFrequencyData();
        const timeDomainData = audioAnalyzerRef.current.getTimeDomainData();
        const bpm = audioAnalyzerRef.current.getBPM();
        const energy = audioAnalyzerRef.current.getEnergy();

        // Create AudioData object for visualization
        const audioData: AudioData = {
          frequencyData,
          timeDomainData,
          bpm,
          energy,
        };

        // Update visualization with current audio data
        updateAudioData(audioData);

        // Reset error count on successful update
        errorCount = 0;

        // Continue the loop
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      } catch (error) {
        console.error('[App] Audio analysis error:', error);
        errorCount++;
        
        // Continue loop unless too many errors
        if (errorCount < MAX_ERRORS) {
          animationFrameRef.current = requestAnimationFrame(updateLoop);
        } else {
          console.error('[App] Too many audio analysis errors, stopping update loop');
        }
      }
    };

    // Start the update loop
    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, isAudioPlaying, audioUrl, isVisualizationInitialized, updateAudioData]);

  // Handle playback state changes for visualization
  useEffect(() => {
    if (!isVisualizationInitialized) {

      return;
    }

    const playing = audioUrl ? isAudioPlaying : isPlaying;

    if (playing && !isRendering) {
      startRendering();
    } else if (!playing && isRendering) {
      stopRendering();
    }
  }, [isPlaying, isAudioPlaying, audioUrl, isRendering, isVisualizationInitialized, startRendering, stopRendering]);

  // Note: Poetry is now generated immediately when audio is loaded with librosa analysis
  // No need for periodic generation or real-time analysis

  // Audio handlers
  // Extract YouTube video ID from URL
  const extractYouTubeVideoId = (url: string): string | null => {
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
    
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return match[1];
    
    match = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (match) return match[1];
    
    return null;
  };

  const handleUrlSubmit = useCallback(async (url: string) => {

    // Reset content ready state
    setIsContentReady(false);
    
    // Requirement 7.2: Display contextual messages during audio analysis
    showAnalysisMessage('loading');
    
    try {
      // Check if it's a YouTube URL
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      
      if (isYouTube) {
        // Use audio-with-analysis endpoint (downloads, analyzes, and returns file)
        const response = await fetch(`http://localhost:3001/api/youtube/audio-with-analysis?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to process YouTube video');
        }

        // Download the audio file as Blob and create object URL
        const audioFileUrl = `http://localhost:3001/api/audio/${data.audioFile}`;

        const audioResponse = await fetch(audioFileUrl);
        if (!audioResponse.ok) {
          throw new Error('Failed to download audio file');
        }
        
        const audioBlob = await audioResponse.blob();
        const blobUrl = URL.createObjectURL(audioBlob);

        setAudioUrl(blobUrl);
        
        showAnalysisMessage('validating');
        await new Promise(resolve => setTimeout(resolve, 500));
        showAnalysisMessage('analyzing');
        
        // Generate poetry immediately using librosa analysis

        showAnalysisMessage('generating');
        
        const features = {
          tempo: data.analysis.tempo,
          key: data.analysis.key,
          energy: data.analysis.energy,
          valence: data.analysis.valence,
          spectralCentroid: data.analysis.spectral_centroid,
          spectralRolloff: data.analysis.spectral_rolloff,
          zeroCrossingRate: data.analysis.zero_crossing_rate,
          mfcc: data.analysis.mfcc_mean,
          mood: data.analysis.mood,
          intensity: data.analysis.intensity,
          complexity: data.analysis.complexity
        };
        
        await generateFromAudio(features);
        
        // Store analysis data for manual generation
        setAnalysisData(data.analysis);
        
        // Generate visualization configuration from AI
        if (vizConfigGeneratorRef.current && isVisualizationInitialized) {

          try {
            const vizConfig = await vizConfigGeneratorRef.current.generateConfig(data.analysis);

            // Apply visualization config to engine
            applyVisualizationAIConfig(vizConfig);
          } catch (error) {
            console.error('[App] Failed to generate visualization config:', error);
          }
        }
        
        // Mark content as ready (audio + analysis + poetry + visualization complete)
        setIsContentReady(true);
        
        // Store thumbnail URL (use proxy to avoid CORS)
        if (data.videoInfo.thumbnail) {
          const proxiedThumbnailUrl = `http://localhost:3001/api/thumbnail?url=${encodeURIComponent(data.videoInfo.thumbnail)}`;


          setThumbnailUrl(proxiedThumbnailUrl);
          
          // Also set it immediately if visualization is ready
          if (isVisualizationInitialized) {

            setVisualizationBackgroundImage(proxiedThumbnailUrl);
          }
        }

      } else {
        await loadFromURL(url);
        showAnalysisMessage('validating');
        await new Promise(resolve => setTimeout(resolve, 500));
        showAnalysisMessage('analyzing');
        
        // Auto-play after loading
        setTimeout(() => {
          handlePlay();
        }, 500);
      }
    } catch (error) {
      console.error('[App] URL load error:', error);
    }
  }, [loadFromURL, showAnalysisMessage]);

  const handlePlay = useCallback(() => {
    if (!audioManager || !currentSource) {
      console.warn('[App] Cannot play: no audio loaded');
      return;
    }

    try {
      // Requirement 7.3: Show transitional animations connecting visual and textual elements
      showTransition('ready', 'playing');
      
      // Track experience start time for summary
      if (!experienceStartTimeRef.current) {
        experienceStartTimeRef.current = Date.now();
      }
      
      play();
      
      // Visualization rendering will be started automatically by useEffect
      // when isPlaying becomes true
      
      // Initialize AudioAnalyzer after play() creates the source node
      // Use a small delay to ensure the source node is created
      setTimeout(() => {
        const audioContext = audioManager.getAudioContext();
        const sourceNode = audioManager.getSourceNode();
        
        if (audioContext && sourceNode && audioAnalyzerRef.current) {
          try {
            audioAnalyzerRef.current.initialize(audioContext, sourceNode);


            // Show analysis message when ready
            showAnalysisMessage('ready');
          } catch (error) {
            console.error('[App] AudioAnalyzer initialization error:', error);
            console.error('[App] Audio-to-poetry pipeline failed to initialize');
            // The app will continue but without audio analysis features
          }
        } else {
          console.warn('[App] Missing required components for AudioAnalyzer initialization');
        }
      }, 50);
    } catch (error) {
      console.error('[App] Play error:', error);
    }
  }, [play, audioManager, currentSource, showTransition, showAnalysisMessage]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleStop = useCallback(() => {
    stop();
    
    // Requirement 7.5: Offer summary view showcasing generated poetry and key moments
    // Show summary when experience ends
    if (experienceStartTimeRef.current) {
      const experienceDuration = (Date.now() - experienceStartTimeRef.current) / 1000;
      
      showSummary({
        duration: experienceDuration,
        poemsGenerated: poems.length,
        interactionsCount: interactionCountRef.current,
        visualizationMode,
        highlights: poems.slice(0, 3).map((poem, i) => `Poem ${i + 1}: ${poem.text?.substring(0, 50) || ''}...`),
      });
      
      // Reset experience tracking
      experienceStartTimeRef.current = null;
      interactionCountRef.current = 0;
    }
    
    // Requirement 7.3: Show transitional animations
    showTransition('playing', 'stopped');
    
    // Disconnect audio analyzer when stopping
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.disconnect();
    }
  }, [stop, showSummary, showTransition, poems, visualizationMode]);

  const handleSeek = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    // TODO: Implement volume control in AudioManager
  }, []);

  const handleManualPoetryGeneration = useCallback(async () => {
    if (!analysisData) {
      console.warn('[App] No analysis data available');
      return;
    }

    try {

      showAnalysisMessage('generating');
      
      const features = {
        tempo: analysisData.tempo,
        key: analysisData.key,
        energy: analysisData.energy,
        valence: analysisData.valence,
        spectralCentroid: analysisData.spectral_centroid,
        spectralRolloff: analysisData.spectral_rolloff,
        zeroCrossingRate: analysisData.zero_crossing_rate,
        mfcc: analysisData.mfcc_mean,
        mood: analysisData.mood,
        intensity: analysisData.intensity,
        complexity: analysisData.complexity
      };
      
      await generateFromAudio(features);
    } catch (error) {
      console.error('[App] Manual poetry generation error:', error);
    }
  }, [analysisData, generateFromAudio, showAnalysisMessage]);

  // Visualization handlers
  const handleVisualizationModeChange = useCallback((mode: VisualizationMode) => {
    // Requirement 7.3: Show transitional animations connecting visual and textual elements
    const currentModeLabel = visualizationMode.replace('-', ' ');
    const newModeLabel = mode.replace('-', ' ');
    showTransition(currentModeLabel, newModeLabel);
    
    setVisualizationMode(mode);
  }, [setVisualizationMode, visualizationMode, showTransition]);

  const handleVisualizationCanvasReady = useCallback((canvas: HTMLCanvasElement) => {

    try {
      // Initialize the visualization engine with the canvas
      initializeVisualization(canvas);
    } catch (error) {
      console.error('[App] Visualization initialization error:', error);
    }
  }, [initializeVisualization]);



  const hasAudio = duration > 0;

  // Display audio error if present
  useEffect(() => {
    if (audioError) {
      console.error('[App] Audio error:', audioError);
      // TODO: Display error to user in UI
    }
  }, [audioError]);

  // Show guidance hint when first poem is generated
  // Requirement 7.4: Provide subtle guidance hints during interaction
  useEffect(() => {
    if (poems.length === 1) {
      // Show hint after first poem
      setTimeout(() => {
        showGuidanceHint('Try switching visualization modes to see different effects');
      }, 2000);
    }
  }, [poems.length, showGuidanceHint]);

  // Set YouTube thumbnail as background image for visualization when it becomes ready
  useEffect(() => {
    if (thumbnailUrl && isVisualizationInitialized) {
      setVisualizationBackgroundImage(thumbnailUrl);
    }
  }, [thumbnailUrl, isVisualizationInitialized, setVisualizationBackgroundImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      {/* Storytelling Display - Requirements 7.1, 7.2, 7.3, 7.4, 7.5 */}
      <StorytellingDisplay currentMessage={currentMessage} />
      
      {/* Header */}
      <header className="text-center mb-8 pt-4">
        <h1 className="text-5xl font-bold text-white mb-2">
          Music Poetry Canvas
        </h1>
        <p className="text-xl text-gray-300">
          Transform music into poetry and art
        </p>
      </header>

      {/* Main Content Grid */}
      <div className="max-w-[1400px] mx-auto">
        {/* Input Section - Always visible */}
        <div className="mb-6">
          <AudioInput
            onUrlSubmit={handleUrlSubmit}
            isLoading={playbackState === 'loading'}
          />
        </div>

        {/* Content Area - Show loading or content */}
        {(playbackState === 'loading' || (audioUrl && !isContentReady)) ? (
          /* Loading Overlay */
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-12 shadow-xl">
            <div className="flex flex-col items-center justify-center min-h-[600px]">
              <div className="relative">
                {/* Spinning loader */}
                <div className="w-24 h-24 border-8 border-purple-200/30 border-t-purple-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-24 h-24 border-8 border-transparent border-r-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-semibold text-white mb-2">Analyzing your music...</h3>
                <p className="text-gray-300">Extracting audio features, generating poetry, and preparing visualization</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>
        ) : audioUrl && isContentReady ? (
          /* Main Content Grid - Show when ready */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Player (3 columns = 25%) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Audio Player Area */}
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Audio Player</h3>
                
                {/* Native HTML5 Audio Player */}
                <audio
                ref={audioElementRef}
                controls
                src={audioUrl}
                className="w-full"
                onPlay={() => {
                  setIsAudioPlaying(true);
                  if (!experienceStartTimeRef.current) {
                    experienceStartTimeRef.current = Date.now();
                  }
                  showTransition('ready', 'playing');
                  
                  // Initialize AudioAnalyzer with HTML5 audio element (only once)
                  const audioElement = audioElementRef.current;
                  if (audioElement && audioAnalyzerRef.current && !mediaSourceRef.current) {
                    try {
                      const audioContext = new AudioContext();
                      const source = audioContext.createMediaElementSource(audioElement);
                      source.connect(audioContext.destination);
                      
                      mediaSourceRef.current = source;
                      audioAnalyzerRef.current.initialize(audioContext, source);

                    } catch (error) {
                      console.error('[App] AudioAnalyzer initialization error:', error);
                    }
                  }
                }}
                onPause={() => {
                  setIsAudioPlaying(false);
                  showTransition('playing', 'paused');
                }}
                onEnded={() => {
                  setIsAudioPlaying(false);
                  handleStop();
                }}
                style={{
                  width: '100%',
                  outline: 'none'
                }}
              />
              </div>
            </div>

            {/* Center Column - Main Visualization (6 columns = 50%) */}
            <div className="lg:col-span-6 space-y-6">
              <VisualizationCanvas
                mode={visualizationMode}
                onModeChange={handleVisualizationModeChange}
                onCanvasReady={handleVisualizationCanvasReady}
                isPlaying={audioUrl ? isAudioPlaying : isPlaying}
              />
            </div>

            {/* Right Column - Poetry (3 columns = 25%) */}
            <div className="lg:col-span-3 space-y-6">
              <PoetryDisplay
                poems={poems}
                currentPoem={currentPoem || ''}
                isGenerating={isGeneratingPoetry}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="text-center mt-8 pb-4">
        <p className="text-sm text-gray-400">
          An immersive audio-visual poetry experience
        </p>
      </footer>
    </div>
  );
}

export default App;
