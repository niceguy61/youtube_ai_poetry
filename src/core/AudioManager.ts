/**
 * Audio Manager Core
 * 
 * Manages audio source loading, playback control, and coordination with other components.
 * Requirements: 1.1, 1.2, 1.3, 1.6
 */

import type { AudioSource, AudioMetadata, PlaybackState } from '../types/audio';
import { DurationValidator } from '../services/DurationValidator';

type PlaybackStateCallback = (state: PlaybackState) => void;
type TimeUpdateCallback = (time: number) => void;

/**
 * AudioManager class
 * 
 * Responsible for:
 * - Loading audio from files, URLs, and YouTube
 * - Managing playback state and controls
 * - Coordinating with DurationValidator
 * - Emitting events for state changes and time updates
 */
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private currentSource: AudioSource | null = null;
  private playbackState: PlaybackState = 'idle';
  private currentTime: number = 0;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private animationFrameId: number | null = null;
  private durationValidator: DurationValidator;
  
  // Event subscribers
  private playbackStateCallbacks: Set<PlaybackStateCallback> = new Set();
  private timeUpdateCallbacks: Set<TimeUpdateCallback> = new Set();

  constructor() {
    this.durationValidator = new DurationValidator();
  }

  /**
   * Load audio from a local file
   * Supports MP3 and OGG formats
   * 
   * @param file - The audio file to load
   * @returns Promise resolving to AudioSource
   * @throws Error if file format is invalid or duration exceeds limit
   */
  async loadFromFile(file: File): Promise<AudioSource> {
    this.setPlaybackState('loading');

    try {
      // Validate file format
      const validFormats = ['audio/mpeg', 'audio/mp3', 'audio/ogg'];
      if (!validFormats.includes(file.type)) {
        throw new Error(`Invalid file format: ${file.type}. Only MP3 and OGG formats are supported.`);
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Initialize audio context if needed
      await this.ensureAudioContext();

      // Decode audio data
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

      // Validate duration
      const validationResult = this.durationValidator.validate(audioBuffer.duration);
      if (!validationResult.isValid) {
        this.setPlaybackState('error');
        throw new Error(validationResult.message);
      }

      // Create AudioSource
      const audioSource: AudioSource = {
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          sourceType: 'file'
        }
      };

      this.audioBuffer = audioBuffer;
      this.currentSource = audioSource;
      this.currentTime = 0;
      this.setPlaybackState('stopped');

      return audioSource;
    } catch (error) {
      this.setPlaybackState('error');
      throw error;
    }
  }

  /**
   * Load audio from a public web URL
   * 
   * @param url - The URL pointing to the audio resource
   * @returns Promise resolving to AudioSource
   * @throws Error if URL is invalid, fetch fails, or duration exceeds limit
   */
  async loadFromURL(url: string): Promise<AudioSource> {
    this.setPlaybackState('loading');

    try {
      // Validate URL format
      if (!this.isValidURL(url)) {
        throw new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.');
      }

      // Fetch audio data
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      // Get array buffer
      const arrayBuffer = await response.arrayBuffer();

      // Initialize audio context if needed
      await this.ensureAudioContext();

      // Decode audio data
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

      // Validate duration
      const validationResult = this.durationValidator.validate(audioBuffer.duration);
      if (!validationResult.isValid) {
        this.setPlaybackState('error');
        throw new Error(validationResult.message);
      }

      // Extract filename from URL
      const urlPath = new URL(url).pathname;
      const filename = urlPath.substring(urlPath.lastIndexOf('/') + 1) || 'Audio from URL';

      // Create AudioSource
      const audioSource: AudioSource = {
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        metadata: {
          title: filename,
          sourceType: 'url'
        }
      };

      this.audioBuffer = audioBuffer;
      this.currentSource = audioSource;
      this.currentTime = 0;
      this.setPlaybackState('stopped');

      return audioSource;
    } catch (error) {
      this.setPlaybackState('error');
      throw error;
    }
  }

  /**
   * Load audio from a YouTube URL
   * Uses YouTubeExtractor service to extract audio from YouTube videos
   * 
   * @param url - The YouTube video URL
   * @returns Promise resolving to AudioSource
   * @throws Error if YouTube extraction fails
   */
  async loadFromYouTube(url: string): Promise<AudioSource> {
    this.setPlaybackState('loading');
    
    try {
      // Initialize audio context if not already initialized
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Import YouTubeExtractor dynamically
      const { YouTubeExtractor } = await import('../services/YouTubeExtractor');
      const extractor = new YouTubeExtractor();

      // Extract audio with comprehensive analysis
      const result = await extractor.extractAudioWithAnalysis(url);
      
      console.log('[AudioManager] YouTube audio with analysis:', {
        title: result.videoInfo.title,
        duration: result.videoInfo.duration,
        tempo: result.analysis.tempo,
        key: result.analysis.key,
        mood: result.analysis.mood
      });

      // Validate duration (5 minute limit)
      const validationResult = this.durationValidator.validate(result.videoInfo.duration);
      if (!validationResult.isValid) {
        throw new Error(validationResult.message || 'Video duration exceeds 5 minute limit');
      }

      // Extract video ID for thumbnail
      const videoId = this.extractYouTubeVideoId(url);
      const thumbnailUrl = videoId 
        ? `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        : undefined;

      const audioBuffer = result.audioBuffer;

      // Create audio source with analysis
      const audioSource: AudioSource = {
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        metadata: {
          title: result.videoInfo.title,
          artist: result.videoInfo.author,
          sourceType: 'youtube',
          thumbnailUrl,
          analysis: result.analysis
        }
      };

      this.currentSource = audioSource;
      this.audioBuffer = audioBuffer; // Set audioBuffer for playback
      this.setPlaybackState('stopped');

      console.log('[AudioManager] YouTube audio loaded successfully:', {
        duration: audioSource.duration,
        title: audioSource.metadata.title,
        thumbnailUrl
      });

      return audioSource;

    } catch (error) {
      console.error('[AudioManager] YouTube load error:', error);
      this.setPlaybackState('error');
      throw error;
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    // Standard watch URL
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];

    // Short URL
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return match[1];

    // Embed URL
    match = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (match) return match[1];

    return null;
  }

  /**
   * Start or resume audio playback
   * 
   * @throws Error if no audio is loaded
   */
  play(): void {
    if (!this.audioBuffer) {
      throw new Error('No audio loaded. Please load an audio source first.');
    }

    if (this.playbackState === 'playing') {
      return; // Already playing
    }

    // Resume audio context if suspended
    if (this.audioContext!.state === 'suspended') {
      this.audioContext!.resume();
    }

    // Create new source node
    this.sourceNode = this.audioContext!.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.audioContext!.destination);

    // Handle playback end
    this.sourceNode.onended = () => {
      if (this.playbackState === 'playing') {
        this.stop();
      }
    };

    // Calculate start offset for resume
    const offset = this.playbackState === 'paused' ? this.pauseTime : 0;
    this.startTime = this.audioContext!.currentTime - offset;

    // Start playback
    this.sourceNode.start(0, offset);
    this.setPlaybackState('playing');

    // Start time update loop
    this.startTimeUpdateLoop();
  }

  /**
   * Pause audio playback
   */
  pause(): void {
    if (this.playbackState !== 'playing') {
      return;
    }

    // Store current time for resume
    this.pauseTime = this.audioContext!.currentTime - this.startTime;
    this.currentTime = this.pauseTime;

    // Stop the source node
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.setPlaybackState('paused');
    this.stopTimeUpdateLoop();
  }

  /**
   * Stop audio playback and reset to beginning
   */
  stop(): void {
    if (this.playbackState === 'idle' || this.playbackState === 'loading') {
      return;
    }

    // Stop the source node
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        // Source may already be stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Reset time
    this.currentTime = 0;
    this.pauseTime = 0;
    this.startTime = 0;

    this.setPlaybackState('stopped');
    this.stopTimeUpdateLoop();
  }

  /**
   * Seek to a specific time in the audio
   * 
   * @param time - The time in seconds to seek to
   * @throws Error if time is out of bounds
   */
  seek(time: number): void {
    if (!this.audioBuffer) {
      throw new Error('No audio loaded. Cannot seek.');
    }

    if (time < 0 || time > this.audioBuffer.duration) {
      throw new Error(`Seek time ${time}s is out of bounds (0-${this.audioBuffer.duration}s)`);
    }

    const wasPlaying = this.playbackState === 'playing';

    // Stop current playback
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Update time
    this.pauseTime = time;
    this.currentTime = time;

    // Resume playback if it was playing
    if (wasPlaying) {
      this.play();
    } else {
      this.setPlaybackState('paused');
    }
  }

  /**
   * Get the current playback time in seconds
   * 
   * @returns Current time in seconds
   */
  getCurrentTime(): number {
    if (this.playbackState === 'playing' && this.audioContext) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.currentTime;
  }

  /**
   * Get the total duration of the loaded audio
   * 
   * @returns Duration in seconds, or 0 if no audio is loaded
   */
  getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  /**
   * Check if audio is currently playing
   * 
   * @returns True if playing, false otherwise
   */
  isPlaying(): boolean {
    return this.playbackState === 'playing';
  }

  /**
   * Get the current playback state
   * 
   * @returns Current PlaybackState
   */
  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  /**
   * Get the current audio source
   * 
   * @returns Current AudioSource or null if none loaded
   */
  getCurrentSource(): AudioSource | null {
    return this.currentSource;
  }

  /**
   * Get the audio context for external use (e.g., AudioAnalyzer)
   * 
   * @returns AudioContext or null if not initialized
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get the current source node for external use (e.g., AudioAnalyzer)
   * 
   * @returns AudioBufferSourceNode or null if not playing
   */
  getSourceNode(): AudioBufferSourceNode | null {
    return this.sourceNode;
  }

  /**
   * Subscribe to playback state changes
   * 
   * @param callback - Function to call when state changes
   * @returns Unsubscribe function
   */
  onPlaybackStateChange(callback: PlaybackStateCallback): () => void {
    this.playbackStateCallbacks.add(callback);
    return () => {
      this.playbackStateCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to time updates
   * 
   * @param callback - Function to call with current time
   * @returns Unsubscribe function
   */
  onTimeUpdate(callback: TimeUpdateCallback): () => void {
    this.timeUpdateCallbacks.add(callback);
    return () => {
      this.timeUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioBuffer = null;
    this.currentSource = null;
    this.playbackStateCallbacks.clear();
    this.timeUpdateCallbacks.clear();
  }

  // Private helper methods

  /**
   * Ensure AudioContext is initialized
   */
  private async ensureAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Set playback state and notify subscribers
   */
  private setPlaybackState(state: PlaybackState): void {
    if (this.playbackState !== state) {
      this.playbackState = state;
      this.playbackStateCallbacks.forEach(callback => callback(state));
    }
  }

  /**
   * Start the time update loop
   */
  private startTimeUpdateLoop(): void {
    const updateTime = () => {
      if (this.playbackState === 'playing') {
        this.currentTime = this.getCurrentTime();
        this.timeUpdateCallbacks.forEach(callback => callback(this.currentTime));
        this.animationFrameId = requestAnimationFrame(updateTime);
      }
    };
    this.animationFrameId = requestAnimationFrame(updateTime);
  }

  /**
   * Stop the time update loop
   */
  private stopTimeUpdateLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
