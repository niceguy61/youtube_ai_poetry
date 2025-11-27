import { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import {
  AudioInput,
  VisualizationCanvas,
  PoetryDisplay,
  StorytellingDisplay,
  MusicInfo,
  AudioMetadataCard,
} from './components';
import { SettingsPanel } from './components/SettingsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { useAudioManager } from './hooks/useAudioManager';
import { useVisualization } from './hooks/useVisualization';
import { usePoetryGenerator } from './hooks/usePoetryGenerator';
import { useStorytellingManager } from './hooks/useStorytellingManager';
import { useSettingsStore } from './stores/settingsStore';
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
    error: poetryError,
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

  // Settings panel state
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // Audio analyzer instance
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Visualization config generator
  const vizConfigGeneratorRef = useRef<VisualizationConfigGenerator | null>(null);

  // Get loadSettings from settings store
  // Requirements: 8.2, 8.4 - Initialize settings on app load
  const { loadSettings } = useSettingsStore();

  // Load settings on app mount
  // Requirements: 8.2, 8.4 - Initialize settings on app load and handle corrupted settings
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        console.log('[App] Loading settings from storage...');
        await loadSettings();
        console.log('[App] Settings loaded successfully');
      } catch (error) {
        console.error('[App] Failed to load settings, using defaults:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
        toast.warning('Settings Load Failed', {
          description: `${errorMessage}. Using default settings.`,
          duration: 4000,
        });
      }
    };

    initializeSettings();
  }, [loadSettings]);

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
        const response = await fetch(`${CONFIG.api.ENDPOINT}/api/youtube/audio-with-analysis?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to process YouTube video');
        }

        // Download the audio file as Blob and create object URL
        const audioFileUrl = `${CONFIG.api.ENDPOINT}/api/audio/${data.audioFile}`;

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
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate visualization config';
            toast.warning('Visualization Config Failed', {
              description: `${errorMessage}. Using default visualization.`,
              duration: 4000,
            });
          }
        }
        
        // Mark content as ready (audio + analysis + poetry + visualization complete)
        setIsContentReady(true);
        
        // Store video info
        if (data.videoInfo) {
          setVideoInfo({
            title: data.videoInfo.title,
            author: data.videoInfo.author,
            duration: data.videoInfo.duration,
          });
        }
        
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      toast.error('Audio Load Failed', {
        description: errorMessage,
        duration: 5000,
      });
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
            const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio analyzer';
            toast.warning('Audio Analysis Unavailable', {
              description: `${errorMessage}. Visualization may be limited.`,
              duration: 4000,
            });
          }
        } else {
          console.warn('[App] Missing required components for AudioAnalyzer initialization');
        }
      }, 50);
    } catch (error) {
      console.error('[App] Play error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      toast.error('Playback Error', {
        description: errorMessage,
        duration: 5000,
      });
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate poetry';
      toast.error('Poetry Generation Failed', {
        description: errorMessage,
        duration: 5000,
      });
    }
  }, [analysisData, generateFromAudio, showAnalysisMessage]);

  // Handle poetry regeneration
  // Requirements: 2.1, 2.2, 2.3, 2.5
  const handlePoetryRegeneration = useCallback(async () => {
    if (!analysisData) {
      console.warn('[App] No analysis data available for regeneration');
      return;
    }

    try {
      console.log('[App] Regenerating poetry with current audio data');
      
      // Use current audio analysis data for regeneration
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
      
      // Generate new poem using current audio data
      await generateFromAudio(features);
      
      console.log('[App] Poetry regeneration complete');
      toast.success('Poetry Regenerated', {
        description: 'A new poem has been generated from your music',
        duration: 3000,
      });
    } catch (error) {
      console.error('[App] Poetry regeneration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate poetry';
      toast.error('Regeneration Failed', {
        description: errorMessage,
        duration: 5000,
      });
    }
  }, [analysisData, generateFromAudio]);

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize visualization';
      toast.error('Visualization Error', {
        description: errorMessage,
        duration: 5000,
      });
    }
  }, [initializeVisualization]);



  const hasAudio = duration > 0;

  // Display audio error if present
  useEffect(() => {
    if (audioError) {
      console.error('[App] Audio error:', audioError);
      toast.error('Audio Error', {
        description: audioError,
        duration: 5000,
      });
    }
  }, [audioError]);

  // Display poetry error if present
  useEffect(() => {
    if (poetryError) {
      console.error('[App] Poetry error:', poetryError);
      toast.error('Poetry Generation Failed', {
        description: poetryError,
        duration: 5000,
      });
    }
  }, [poetryError]);

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
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden overflow-y-hidden">
      {/* Fixed Header - Burgundy Theme */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, width: '100%', height: '10vh', zIndex: 50, backgroundColor: '#800020', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ height: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '100%' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#800020]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">
              Music Poetry Canvas
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-white hover:text-white/80 transition-colors text-sm font-medium">
                Home
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors text-sm font-medium">
                About
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors text-sm font-medium">
                Gallery
              </a>
            </nav>
            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsPanelOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open settings"
              title="Settings"
            >
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Storytelling Display - Requirements 7.1, 7.2, 7.3, 7.4, 7.5 */}
      <StorytellingDisplay currentMessage={currentMessage} />

      {/* Main Content Area - 80vh between header and footer */}
      <main className="fixed top-[10vh] left-0 right-0 w-full h-[80vh] overflow-y-auto overflow-x-hidden" style={{ paddingLeft: '30px', paddingRight: '30px' }}>
        <div className="w-full py-4">
        {/* Input Section - Always visible */}
        <div className="mb-lg">
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
              <div className="mt-xl text-center">
                <h3 className="text-2xl font-bold text-white mb-sm">Analyzing your music...</h3>
                <p className="text-base text-gray-300">Extracting audio features, generating poetry, and preparing visualization</p>
                <div className="mt-md flex items-center justify-center gap-sm text-sm text-gray-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>
        ) : audioUrl && isContentReady ? (
          /* Main Content Grid - Show when ready */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            {/* Left Column - Player (3 columns = 25%) */}
            <div className="lg:col-span-3 space-y-lg">
              {/* Audio Player Area */}
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-lg shadow-xl">
                <h3 className="text-xl font-bold text-white mb-md transition-colors hover:text-gray-100">Audio Player</h3>
                
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

              {/* Audio Metadata Card */}
              <AudioMetadataCard 
                analysis={analysisData}
                videoInfo={videoInfo}
              />
            </div>

            {/* Center Column - Main Visualization (6 columns = 50%) */}
            <div className="lg:col-span-6 space-y-lg">
              <VisualizationCanvas
                mode={visualizationMode}
                onModeChange={handleVisualizationModeChange}
                onCanvasReady={handleVisualizationCanvasReady}
                isPlaying={audioUrl ? isAudioPlaying : isPlaying}
              />
            </div>

            {/* Right Column - Poetry (3 columns = 25%) */}
            <div className="lg:col-span-3 space-y-lg">
              <PoetryDisplay
                poems={poems}
                currentPoem={currentPoem || ''}
                isGenerating={isGeneratingPoetry}
                onRegenerate={analysisData ? handlePoetryRegeneration : undefined}
                regenerationError={poetryError}
              />
            </div>
          </div>
        ) : null}
        </div>
      </main>

      {/* Fixed Footer - Burgundy Theme */}
      <footer className="fixed top-[90vh] left-0 right-0 w-full h-[10vh] z-40 bg-[#800020] shadow-lg">
        <div className="h-full px-8 flex items-center justify-between max-w-full" style={{ paddingRight: '30px' }}>
          <p className="text-sm text-white font-medium">
            © 2025 Music Poetry Canvas
          </p>
          <div className="flex items-center gap-8">
            {/* GitHub */}
            <a 
              href="https://github.com/niceguy61" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              title="GitHub"
            >
              <svg style={{ width: '24px', height: '24px' }} fill="white" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a 
              href="https://linkedin.com/in/drumgoon" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              title="LinkedIn"
            >
              <svg style={{ width: '24px', height: '24px' }} fill="white" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Settings Panel Modal */}
      <ErrorBoundary>
        <SettingsPanel
          isOpen={isSettingsPanelOpen}
          onClose={() => setIsSettingsPanelOpen(false)}
        />
      </ErrorBoundary>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default App;
