/**
 * YouTube Audio Extraction Backend Service (yt-dlp version)
 * 
 * This Express server provides an API endpoint for extracting audio from YouTube videos.
 * It uses yt-dlp (more reliable than ytdl-core) to download audio streams.
 * 
 * Endpoints:
 * - GET /api/youtube/info?url=<youtube_url> - Get video metadata
 * - GET /api/youtube/audio?url=<youtube_url> - Stream audio data
 */

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { URL } from 'url';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

/**
 * Validates if a URL is a valid YouTube URL
 */
function isValidYouTubeURL(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return (
      (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') &&
      (urlObj.pathname === '/watch' && urlObj.searchParams.has('v'))
    ) || (
      (hostname === 'youtu.be') &&
      urlObj.pathname.length > 1
    );
  } catch {
    return false;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'youtube-audio-extractor-ytdlp' });
});

/**
 * Get YouTube video information using yt-dlp
 */
app.get('/api/youtube/info', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    if (!isValidYouTubeURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`[YouTube Info] Fetching info for: ${url}`);

    // Use yt-dlp to get video info
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      url
    ]);

    let jsonData = '';
    let errorData = '';

    ytdlp.stdout.on('data', (data) => {
      jsonData += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error('[YouTube Info] Error:', errorData);
        return res.status(500).json({ 
          error: 'Failed to fetch video information',
          details: errorData
        });
      }

      try {
        const videoInfo = JSON.parse(jsonData);
        const duration = videoInfo.duration || 0;

        // Check duration (5 minute limit = 300 seconds)
        if (duration > 300) {
          return res.status(400).json({ 
            error: 'Video duration exceeds 5 minute limit',
            duration,
            maxDuration: 300
          });
        }

        res.json({
          title: videoInfo.title || 'Unknown',
          duration,
          thumbnail: videoInfo.thumbnail || '',
          author: videoInfo.uploader || videoInfo.channel || 'Unknown',
          url: videoInfo.webpage_url || url
        });

      } catch (parseError) {
        console.error('[YouTube Info] JSON parse error:', parseError);
        res.status(500).json({ 
          error: 'Failed to parse video information',
          details: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('[YouTube Info] Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch video information',
      message: error.message 
    });
  }
});

/**
 * Stream YouTube audio using yt-dlp
 */
app.get('/api/youtube/audio', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    if (!isValidYouTubeURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`[YouTube Audio] Streaming audio for: ${url}`);

    // First check duration
    const infoProcess = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      url
    ]);

    let infoData = '';
    infoProcess.stdout.on('data', (data) => {
      infoData += data.toString();
    });

    infoProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[YouTube Audio] Failed to get video info');
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Failed to get video information' });
        }
        return;
      }

      try {
        const videoInfo = JSON.parse(infoData);
        const duration = videoInfo.duration || 0;

        if (duration > 300) {
          return res.status(400).json({ 
            error: 'Video duration exceeds 5 minute limit',
            duration,
            maxDuration: 300
          });
        }

        // Stream audio
        const ytdlp = spawn('yt-dlp', [
          '-f', 'bestaudio',
          '--no-playlist',
          '-o', '-',
          url
        ]);

        // Set response headers
        res.setHeader('Content-Type', 'audio/webm');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Pipe audio to response
        ytdlp.stdout.pipe(res);

        ytdlp.stderr.on('data', (data) => {
          const message = data.toString();
          if (!message.includes('[download]')) {
            console.error('[YouTube Audio] yt-dlp stderr:', message);
          }
        });

        ytdlp.on('error', (error) => {
          console.error('[YouTube Audio] Process error:', error.message);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Failed to stream audio',
              message: error.message 
            });
          }
        });

        ytdlp.on('close', (code) => {
          if (code !== 0) {
            console.error('[YouTube Audio] Process exited with code:', code);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Audio streaming failed' });
            }
          } else {
            console.log('[YouTube Audio] Streaming completed');
          }
        });

      } catch (parseError) {
        console.error('[YouTube Audio] JSON parse error:', parseError);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Failed to parse video information',
            details: parseError.message
          });
        }
      }
    });

  } catch (error) {
    console.error('[YouTube Audio] Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to extract audio',
        message: error.message 
      });
    }
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

/**
 * YouTube Audio with Analysis
 * Downloads YouTube audio, analyzes it with librosa, and returns both
 */
app.get('/api/youtube/audio-with-analysis', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  if (!isValidYouTubeURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  
  console.log(`[YouTube Audio+Analysis] Processing: ${url}`);
  
  try {
    // First, get video info to check duration
    const infoProcess = spawn('yt-dlp', ['--dump-json', '--no-playlist', url]);
    
    let infoData = '';
    infoProcess.stdout.on('data', (data) => {
      infoData += data.toString();
    });
    
    infoProcess.on('close', async (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Failed to get video information' });
      }
      
      try {
        const videoInfo = JSON.parse(infoData);
        const duration = videoInfo.duration || 0;
        
        if (duration > 300) {
          return res.status(400).json({ 
            error: 'Video duration exceeds 5 minute limit',
            duration,
            maxDuration: 300
          });
        }
        
        // Download audio to file (keep it for playback)
        const audioFile = `audio_${Date.now()}.mp3`;
        const downloadProcess = spawn('yt-dlp', [
          '-f', 'bestaudio',
          '--extract-audio',
          '--audio-format', 'mp3',
          '--no-playlist',
          '-o', audioFile,
          url
        ]);
        
        downloadProcess.on('close', async (downloadCode) => {
          if (downloadCode !== 0) {
            return res.status(500).json({ error: 'Failed to download audio' });
          }
          
          // Analyze audio with Python librosa
          const python = spawn('python', ['audio_analyzer.py', audioFile]);
          
          let analysisOutput = '';
          python.stdout.on('data', (data) => {
            analysisOutput += data.toString();
          });
          
          python.on('close', (analysisCode) => {
            // Don't delete the file - we'll serve it for playback
            
            if (analysisCode !== 0) {
              return res.status(500).json({ error: 'Audio analysis failed' });
            }
            
            try {
              const analysisResult = JSON.parse(analysisOutput);
              
              if (!analysisResult.success) {
                return res.status(500).json({ error: analysisResult.error });
              }
              
              console.log(`[YouTube Audio+Analysis] Success - Tempo: ${analysisResult.features.tempo}, Mood: ${analysisResult.features.mood}`);
              
              // Return analysis results with audio file path
              res.json({
                success: true,
                videoInfo: {
                  title: videoInfo.title,
                  duration: videoInfo.duration,
                  author: videoInfo.uploader,
                  thumbnail: videoInfo.thumbnail || `https://i3.ytimg.com/vi/${videoInfo.id}/maxresdefault.jpg`
                },
                analysis: analysisResult.features,
                audioFile: audioFile  // Return filename for playback
              });
              
            } catch (parseError) {
              res.status(500).json({ error: 'Failed to parse analysis results' });
            }
          });
        });
        
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse video info' });
      }
    });
    
  } catch (error) {
    console.error(`[YouTube Audio+Analysis] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Audio Analysis Endpoint
 * Analyzes audio using Python librosa and returns comprehensive features
 */
app.post('/api/audio/analyze', async (req, res) => {
  const { audioPath } = req.body;
  
  if (!audioPath) {
    return res.status(400).json({ error: 'Audio path is required' });
  }
  
  console.log(`[Audio Analysis] Analyzing: ${audioPath}`);
  
  try {
    const python = spawn('python', ['audio_analyzer.py', audioPath], {
      cwd: process.cwd()
    });
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`[Audio Analysis] Python script failed:`, errorOutput);
        return res.status(500).json({ 
          error: 'Audio analysis failed',
          details: errorOutput
        });
      }
      
      try {
        const result = JSON.parse(output);
        
        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }
        
        console.log(`[Audio Analysis] Success - Tempo: ${result.features.tempo}, Key: ${result.features.key}, Mood: ${result.features.mood}`);
        res.json(result);
      } catch (parseError) {
        console.error(`[Audio Analysis] Failed to parse output:`, parseError);
        res.status(500).json({ error: 'Failed to parse analysis results' });
      }
    });
    
  } catch (error) {
    console.error(`[Audio Analysis] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Proxy YouTube thumbnails to avoid CORS issues
 */
app.get('/api/thumbnail', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // Use native fetch (Node.js 18+)
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch thumbnail' });
    }
    
    // Get the image as buffer
    const buffer = await response.arrayBuffer();
    
    // Set proper headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the image
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('[Thumbnail Proxy] Error:', error);
    res.status(500).json({ error: 'Failed to proxy thumbnail' });
  }
});

/**
 * Serve audio files
 */
app.get('/api/audio/:filename', async (req, res) => {
  const { filename } = req.params;
  
  // Security: only allow audio files
  if (!filename.match(/^audio_\d+\.mp3$/)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const path = await import('path');
  const fs = await import('fs');
  
  const filePath = path.join(process.cwd(), filename);
  
  console.log(`[Audio Serve] Attempting to serve: ${filePath}`);
  
  // Check if file exists
  try {
    await fs.promises.access(filePath);
    console.log(`[Audio Serve] File exists, sending...`);
    
    // Set proper headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error(`[Audio Serve] Stream error:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio' });
      }
    });
    
    // Delete file after response finishes (not just stream end)
    res.on('finish', () => {
      // Wait a bit to ensure file handle is released
      setTimeout(async () => {
        try {
          await fs.promises.unlink(filePath);
          console.log(`[Audio Serve] Deleted file after serving: ${filename}`);
        } catch (deleteError) {
          console.error(`[Audio Serve] Failed to delete file:`, deleteError);
        }
      }, 1000); // 1 second delay to ensure file handle is released
    });
    
  } catch (error) {
    console.error(`[Audio Serve] File not found:`, error);
    res.status(404).json({ error: 'Audio file not found' });
  }
});

/**
 * Get YouTube audio URL (for direct playback in HTML5 audio player)
 */
app.get('/api/youtube/audio-url', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    if (!isValidYouTubeURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`[YouTube Audio URL] Getting URL for: ${url}`);

    // Use yt-dlp to get the direct audio URL
    const ytdlp = spawn('yt-dlp', [
      '-f', 'bestaudio',
      '--get-url',
      '--no-playlist',
      url
    ]);

    let audioUrl = '';
    let errorData = '';

    ytdlp.stdout.on('data', (data) => {
      audioUrl += data.toString().trim();
    });

    ytdlp.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error('[YouTube Audio URL] Error:', errorData);
        return res.status(500).json({ 
          error: 'Failed to get audio URL',
          details: errorData
        });
      }

      console.log('[YouTube Audio URL] Success:', audioUrl);
      res.json({ audioUrl: audioUrl.trim() });
    });

  } catch (error) {
    console.error('[YouTube Audio URL] Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get audio URL',
      message: error.message 
    });
  }
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🎵 YouTube Audio Extraction Server (yt-dlp) running on port ${PORT}`);
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
