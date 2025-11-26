/**
 * YouTube Extractor Service
 * 
 * Handles extraction of audio from YouTube videos.
 * Uses backend proxy or serverless function for actual extraction.
 */

export interface YouTubeVideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  author: string;
}

export interface YouTubeAudioWithAnalysis {
  videoInfo: YouTubeVideoInfo;
  analysis: import('../types/audio').AudioAnalysisResult;
  audioBuffer: AudioBuffer;
}

export class YouTubeExtractorError extends Error {
  public readonly code: 'INVALID_URL' | 'EXTRACTION_FAILED' | 'NETWORK_ERROR' | 'METADATA_ERROR';

  constructor(
    message: string,
    code: 'INVALID_URL' | 'EXTRACTION_FAILED' | 'NETWORK_ERROR' | 'METADATA_ERROR'
  ) {
    super(message);
    this.name = 'YouTubeExtractorError';
    this.code = code;
  }
}

export class YouTubeExtractor {
  private readonly backendUrl: string;

  constructor(backendUrl?: string) {
    // Use environment variable or default to localhost backend
    const envBackendUrl = import.meta.env.VITE_YOUTUBE_BACKEND_URL;
    this.backendUrl = backendUrl || envBackendUrl || 'http://localhost:3001';
  }

  /**
   * Validates if a URL is a valid YouTube URL
   * Supports various YouTube URL formats
   */
  isValidYouTubeURL(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const patterns = [
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      // Short URL: https://youtu.be/VIDEO_ID
      /^https?:\/\/youtu\.be\/[\w-]+/,
      // Mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
      /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+/,
      // Embed URL: https://www.youtube.com/embed/VIDEO_ID
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  /**
   * Extracts the video ID from a YouTube URL
   */
  private extractVideoId(url: string): string | null {
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
   * Cleans a YouTube URL by removing playlist and other unnecessary parameters
   * Returns a clean URL with only the video ID
   */
  private cleanYouTubeURL(url: string): string {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return url; // Return original if we can't extract ID
    }

    // Return clean URL with only video ID
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  /**
   * Extracts audio from a YouTube video
   * 
   * @param url - YouTube video URL
   * @returns Promise<AudioBuffer> - Decoded audio buffer
   * @throws YouTubeExtractorError if extraction fails
   */
  async extractAudio(url: string): Promise<AudioBuffer> {
    // Validate URL first
    if (!this.isValidYouTubeURL(url)) {
      throw new YouTubeExtractorError(
        'Invalid YouTube URL. Please use format: https://youtube.com/watch?v=... or https://youtu.be/...',
        'INVALID_URL'
      );
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new YouTubeExtractorError(
        'Could not extract video ID from URL',
        'INVALID_URL'
      );
    }

    try {
      // Clean URL to remove playlist parameters
      const cleanUrl = this.cleanYouTubeURL(url);
      
      // Call backend audio extraction endpoint
      const response = await fetch(
        `${this.backendUrl}/api/youtube/audio?url=${encodeURIComponent(cleanUrl)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new YouTubeExtractorError(
          errorData.error || `Extraction failed with status ${response.status}`,
          'EXTRACTION_FAILED'
        );
      }

      // Get audio data as array buffer
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      console.log('[YouTubeExtractor] Audio extracted successfully:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      return audioBuffer;
    } catch (error) {
      if (error instanceof YouTubeExtractorError) {
        throw error;
      }

      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new YouTubeExtractorError(
          'Network error: Could not connect to extraction service. Please check your connection.',
          'NETWORK_ERROR'
        );
      }

      throw new YouTubeExtractorError(
        `Failed to extract audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED'
      );
    }
  }

  /**
   * Gets video metadata without extracting audio
   * 
   * @param url - YouTube video URL
   * @returns Promise<YouTubeVideoInfo> - Video metadata
   * @throws YouTubeExtractorError if metadata retrieval fails
   */
  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    // Validate URL first
    if (!this.isValidYouTubeURL(url)) {
      throw new YouTubeExtractorError(
        'Invalid YouTube URL. Please use format: https://youtube.com/watch?v=... or https://youtu.be/...',
        'INVALID_URL'
      );
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new YouTubeExtractorError(
        'Could not extract video ID from URL',
        'INVALID_URL'
      );
    }

    try {
      // Clean URL to remove playlist parameters
      const cleanUrl = this.cleanYouTubeURL(url);
      
      // Call backend video info endpoint
      const response = await fetch(
        `${this.backendUrl}/api/youtube/info?url=${encodeURIComponent(cleanUrl)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new YouTubeExtractorError(
          errorData.error || `Metadata retrieval failed with status ${response.status}`,
          'METADATA_ERROR'
        );
      }

      const videoInfo: YouTubeVideoInfo = await response.json();

      // Validate response structure
      if (!videoInfo.title || typeof videoInfo.duration !== 'number') {
        throw new YouTubeExtractorError(
          'Invalid metadata response from server',
          'METADATA_ERROR'
        );
      }

      return videoInfo;
    } catch (error) {
      if (error instanceof YouTubeExtractorError) {
        throw error;
      }

      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new YouTubeExtractorError(
          'Network error: Could not connect to extraction service. Please check your connection.',
          'NETWORK_ERROR'
        );
      }

      throw new YouTubeExtractorError(
        `Failed to get video info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'METADATA_ERROR'
      );
    }
  }

  /**
   * Extracts audio with comprehensive analysis from librosa
   * This is more efficient than extractAudio + getVideoInfo separately
   * 
   * @param url - YouTube video URL
   * @returns Promise<YouTubeAudioWithAnalysis> - Audio buffer with analysis
   * @throws YouTubeExtractorError if extraction or analysis fails
   */
  async extractAudioWithAnalysis(url: string): Promise<YouTubeAudioWithAnalysis> {
    // Validate URL first
    if (!this.isValidYouTubeURL(url)) {
      throw new YouTubeExtractorError(
        'Invalid YouTube URL. Please use format: https://youtube.com/watch?v=... or https://youtu.be/...',
        'INVALID_URL'
      );
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new YouTubeExtractorError(
        'Could not extract video ID from URL',
        'INVALID_URL'
      );
    }

    try {
      // Clean URL to remove playlist parameters
      const cleanUrl = this.cleanYouTubeURL(url);
      
      // Call backend audio-with-analysis endpoint
      const response = await fetch(
        `${this.backendUrl}/api/youtube/audio-with-analysis?url=${encodeURIComponent(cleanUrl)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new YouTubeExtractorError(
          errorData.error || `Analysis failed with status ${response.status}`,
          'EXTRACTION_FAILED'
        );
      }

      const result = await response.json();

      if (!result.success || !result.analysis) {
        throw new YouTubeExtractorError(
          'Invalid analysis response from server',
          'EXTRACTION_FAILED'
        );
      }

      console.log('[YouTubeExtractor] Analysis received:', {
        tempo: result.analysis.tempo,
        key: result.analysis.key,
        mood: result.analysis.mood
      });

      // Now get the actual audio
      const audioBuffer = await this.extractAudio(url);

      return {
        videoInfo: result.videoInfo,
        analysis: result.analysis,
        audioBuffer
      };

    } catch (error) {
      if (error instanceof YouTubeExtractorError) {
        throw error;
      }

      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new YouTubeExtractorError(
          'Network error: Could not connect to extraction service. Please check your connection.',
          'NETWORK_ERROR'
        );
      }

      throw new YouTubeExtractorError(
        `Failed to extract audio with analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED'
      );
    }
  }
}
