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
 * Get available Ollama models
 * Fetches the list of models from the local Ollama instance
 */
app.get('/api/ollama/models', async (req, res) => {
  try {
    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    console.log(`[Ollama Models] Fetching models from: ${ollamaEndpoint}`);

    // Fetch models from Ollama API
    const response = await fetch(`${ollamaEndpoint}/api/tags`);

    if (!response.ok) {
      console.error(`[Ollama Models] Ollama API returned status: ${response.status}`);
      return res.status(503).json({ 
        error: 'Ollama service unavailable',
        message: 'Cannot connect to Ollama. Please ensure Ollama is running.',
        status: response.status
      });
    }

    const data = await response.json();

    // Format the model list
    const models = (data.models || []).map(model => ({
      name: model.name,
      size: model.size,
      modified: model.modified_at,
      digest: model.digest
    }));

    console.log(`[Ollama Models] Found ${models.length} models`);
    res.json({ 
      success: true,
      models 
    });

  } catch (error) {
    console.error('[Ollama Models] Error:', error.message);
    
    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return res.status(503).json({ 
        error: 'Ollama service unavailable',
        message: 'Cannot connect to Ollama. Please ensure Ollama is running.',
        details: error.message
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch Ollama models',
      message: error.message 
    });
  }
});

/**
 * Generate poetry using AI providers (Ollama or OpenAI)
 * Supports persona, language, and provider-specific configuration
 */
app.post('/api/poetry/generate', async (req, res) => {
  try {
    const { 
      audioFeatures, 
      persona = 'hamlet', 
      language = 'ko', 
      provider = 'ollama', 
      model = 'gemma3:4b',
      apiKey 
    } = req.body;

    if (!audioFeatures) {
      return res.status(400).json({ 
        error: 'Audio features are required',
        message: 'Please provide audio analysis data for poetry generation'
      });
    }

    console.log(`[Poetry Generate] Provider: ${provider}, Persona: ${persona}, Language: ${language}, Model: ${model}`);

    // Build the prompt based on audio features, persona, and language
    const prompt = buildPoetryPrompt(audioFeatures, persona, language);

    let poetry;

    if (provider === 'openai') {
      // OpenAI provider
      if (!apiKey) {
        return res.status(400).json({ 
          error: 'API key required',
          message: 'OpenAI API key is required when using OpenAI provider'
        });
      }

      poetry = await generateWithOpenAI(prompt, apiKey);
    } else {
      // Ollama provider (default)
      poetry = await generateWithOllama(prompt, model);
    }

    console.log(`[Poetry Generate] Success - Generated ${poetry.length} characters`);
    res.json({ 
      success: true,
      poetry 
    });

  } catch (error) {
    console.error('[Poetry Generate] Error:', error.message);

    // Handle specific error types
    if (error.statusCode === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided OpenAI API key is invalid or unauthorized',
        details: error.message
      });
    }

    if (error.statusCode === 503) {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: error.message,
        details: error.details
      });
    }

    res.status(500).json({ 
      error: 'Poetry generation failed',
      message: error.message 
    });
  }
});

/**
 * Build poetry generation prompt based on audio features, persona, and language
 */
function buildPoetryPrompt(audioFeatures, persona, language) {
  const { tempo, energy, mood, spectralCentroid, key } = audioFeatures;

  // Persona characteristics mapping
  const personaPrompts = {
    'hamlet': 'in the contemplative, melancholic style of Hamlet, exploring existential themes',
    'nietzsche': 'in the bold, philosophical style of Nietzsche, challenging conventional wisdom',
    'yi-sang': 'in the surreal, modernist style of Yi Sang (이상), with fragmented imagery',
    'baudelaire': 'in the decadent, symbolist style of Baudelaire, exploring beauty and darkness',
    'rimbaud': 'in the rebellious, visionary style of Rimbaud, with vivid sensory imagery',
    'kim-soo-young': 'in the socially conscious, modern style of Kim Soo-young (김수영)',
    'yun-dong-ju': 'in the pure, introspective style of Yun Dong-ju (윤동주), with gentle melancholy',
    'edgar-allan-poe': 'in the dark, gothic style of Edgar Allan Poe, with haunting atmosphere',
    'oscar-wilde': 'in the witty, aesthetic style of Oscar Wilde, celebrating beauty and paradox',
    'kafka': 'in the absurdist, alienated style of Kafka, exploring isolation and bureaucracy',
    'baek-seok': 'in the pastoral, nostalgic style of Baek Seok (백석), with rural imagery'
  };

  // Language instructions with explicit requirements
  const languageInstructions = {
    'ko': 'You MUST write the poem ONLY in Korean (한국어). Do not use any other language.',
    'en': 'You MUST write the poem ONLY in English. Do not use any other language.',
    'ja': 'You MUST write the poem ONLY in Japanese (日本語). Do not use any other language.',
    'zh': 'You MUST write the poem ONLY in Chinese (中文). Do not use any other language.',
    'fr': 'You MUST write the poem ONLY in French (Français). Do not use any other language.',
    'de': 'You MUST write the poem ONLY in German (Deutsch). Do not use any other language.',
    'es': 'You MUST write the poem ONLY in Spanish (Español). Do not use any other language.'
  };

  const personaStyle = personaPrompts[persona] || personaPrompts['hamlet'];
  const languageInstruction = languageInstructions[language] || languageInstructions['ko'];

  return `You are a poetry generator. Your ONLY job is to output poetry text.

Music characteristics:
- Tempo: ${tempo} BPM
- Energy: ${energy.toFixed(2)}
- Mood: ${mood}
- Key: ${key || 'Unknown'}
- Brightness: ${spectralCentroid ? spectralCentroid.toFixed(2) : 'N/A'}

ABSOLUTE REQUIREMENTS - FAILURE TO FOLLOW WILL RESULT IN ERROR:

1. ${languageInstruction}
2. Output ONLY the poem - NO English explanations, NO notes, NO commentary, NO metadata
3. Do NOT write "Here is a poem" or "Okay, here's" or any introduction
4. Do NOT include explanations like "Notes on Musical Translation" or "Character Count"
5. Do NOT ask questions like "Would you like me to"
6. Do NOT include ANY text that is not part of the poem itself
7. Style: ${personaStyle}
8. Length: 2-4 lines (approximately 200-300 characters)

EXAMPLE OF CORRECT OUTPUT (Korean):
가을 햇살 춤추는 밭, 황금빛 곡식 향기
어머니의 따스한 손길, 깊은 정겨움
황리 밭의 노래, 바람에 실려오는
가을 볕에 녹아내리는 시간

EXAMPLE OF INCORRECT OUTPUT (DO NOT DO THIS):
"Okay, here's a poem in the style of..."
"Notes on Musical Translation..."
"Would you like me to..."

NOW OUTPUT ONLY THE POEM:`;
}

/**
 * Generate poetry using Ollama
 */
async function generateWithOllama(prompt, model) {
  const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      if (response.status === 503 || response.status === 502) {
        const error = new Error('Cannot connect to Ollama. Please ensure Ollama is running.');
        error.statusCode = 503;
        error.details = `Ollama returned status ${response.status}`;
        throw error;
      }
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      const serviceError = new Error('Cannot connect to Ollama. Please ensure Ollama is running.');
      serviceError.statusCode = 503;
      serviceError.details = error.message;
      throw serviceError;
    }
    throw error;
  }
}

/**
 * Generate poetry using OpenAI
 */
async function generateWithOpenAI(prompt, apiKey) {
  const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
  
  try {
    const response = await fetch(openaiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a poetic assistant that creates evocative verses inspired by music.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error = new Error('Invalid or unauthorized OpenAI API key');
        error.statusCode = 401;
        throw error;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';

  } catch (error) {
    if (error.statusCode === 401) {
      throw error;
    }
    
    if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND') {
      const serviceError = new Error('Cannot connect to OpenAI API. Please check your internet connection.');
      serviceError.statusCode = 503;
      serviceError.details = error.message;
      throw serviceError;
    }
    
    throw error;
  }
}

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🎵 YouTube Audio Extraction Server (yt-dlp) running on port ${PORT}`);
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
