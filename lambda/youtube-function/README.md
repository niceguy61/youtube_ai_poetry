# YouTube Processing Lambda Function

Python Lambda function for YouTube video processing, audio extraction, and analysis using yt-dlp and librosa.

## Overview

This Lambda function provides two endpoints:
1. **GET /api/youtube/info** - Get YouTube video metadata
2. **GET /api/youtube/audio-with-analysis** - Download audio and analyze with librosa

## Features

- ✅ YouTube URL validation (youtube.com and youtu.be)
- ✅ 5-minute duration limit enforcement
- ✅ Audio extraction with yt-dlp
- ✅ Comprehensive audio analysis with librosa
- ✅ Automatic /tmp cleanup
- ✅ CORS support
- ✅ Detailed error handling

## Dependencies

### Lambda Layers
- **YtdlpLayer**: yt-dlp binary for YouTube audio extraction
- **PythonLibsLayer**: Python libraries (librosa, numpy, scipy, soundfile, audioread)

### Python Packages
See `../layers/python-libs-layer/requirements.txt`:
- librosa==0.10.1
- numpy==1.24.3
- scipy==1.11.4
- soundfile==0.12.1
- audioread==3.0.1

## Configuration

### Lambda Settings
- **Runtime**: Python 3.11
- **Memory**: 2048 MB (librosa requires memory)
- **Timeout**: 60 seconds
- **Environment Variables**:
  - `PYTHONPATH`: /opt/python (for layers)

## API Endpoints

### 1. Get Video Info

**Endpoint**: `GET /api/youtube/info?url=<youtube_url>`

**Request**:
```bash
curl "https://api-gateway-url/api/youtube/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Response** (200 OK):
```json
{
  "title": "Rick Astley - Never Gonna Give You Up",
  "duration": 213,
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "author": "Rick Astley",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Error Responses**:
- `400`: Invalid YouTube URL or duration > 5 minutes
- `500`: Failed to fetch video information
- `504`: Request timeout

---

### 2. Get Audio with Analysis

**Endpoint**: `GET /api/youtube/audio-with-analysis?url=<youtube_url>`

**Request**:
```bash
curl "https://api-gateway-url/api/youtube/audio-with-analysis?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Response** (200 OK):
```json
{
  "success": true,
  "videoInfo": {
    "title": "Rick Astley - Never Gonna Give You Up",
    "duration": 213,
    "author": "Rick Astley",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  },
  "analysis": {
    "duration": 213.0,
    "tempo": 113.28,
    "key": "F#",
    "energy": 0.17,
    "spectral_centroid": 1847.32,
    "valence": 0.65,
    "intensity": 0.42,
    "mood": "upbeat"
  }
}
```

**Error Responses**:
- `400`: Invalid YouTube URL or duration > 5 minutes
- `500`: Failed to download or analyze audio
- `504`: Request timeout

---

## Audio Analysis Features

The librosa analysis extracts:

### Basic Features
- **Duration**: Total audio length in seconds
- **Tempo**: BPM (beats per minute)
- **Key**: Estimated musical key (C, C#, D, etc.)
- **Energy**: RMS energy level (0-1)
- **Spectral Centroid**: "Brightness" of sound

### Derived Features
- **Valence**: Emotional positivity (0-1)
- **Intensity**: Overall intensity (0-1)
- **Complexity**: Musical complexity (0-1)
- **Mood**: Categorical mood (energetic, upbeat, calm, melancholic, etc.)

## File Management

### /tmp Directory
Lambda provides 512MB of /tmp storage. This function:
1. Downloads audio to `/tmp/audio_{request_id}.mp3`
2. Analyzes the audio file
3. **Always cleans up** in finally block

**Important**: Files are automatically deleted after processing to prevent /tmp from filling up.

## Error Handling

### URL Validation
```python
def is_valid_youtube_url(url):
    # Validates youtube.com and youtu.be URLs
    # Returns True/False
```

### Duration Limit
```python
if duration > 300:  # 5 minutes
    return error_response(400, 'Video duration exceeds 5 minute limit')
```

### Subprocess Errors
```python
try:
    result = subprocess.run(['yt-dlp', ...], timeout=30)
except subprocess.TimeoutExpired:
    return error_response(504, 'Request timeout')
```

### File Cleanup
```python
finally:
    if audio_file and os.path.exists(audio_file):
        os.unlink(audio_file)
```

## Testing

### Local Testing (Without SAM)
```bash
cd lambda/youtube-function
python test-handler.py
```

### Local Testing (With SAM)
```bash
cd lambda
sam build
sam local start-api --port 3001

# Test info endpoint
curl "http://localhost:3001/api/youtube/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Test analysis endpoint
curl "http://localhost:3001/api/youtube/audio-with-analysis?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### Unit Testing
```bash
python -m pytest test-handler.py
```

## Deployment

### Build
```bash
cd lambda
sam build
```

### Deploy
```bash
sam deploy --guided
```

### Update
```bash
sam build && sam deploy
```

## Monitoring

### CloudWatch Logs
```bash
# View logs
sam logs -n YouTubeFunction --tail

# Or via AWS CLI
aws logs tail /aws/lambda/music-poetry-backend-YouTubeFunction --follow
```

### CloudWatch Metrics
- **Invocations**: Number of requests
- **Duration**: Execution time (target: < 60s)
- **Errors**: Failed requests
- **Throttles**: Rate limit hits
- **Memory Usage**: Peak memory (target: < 2048MB)

## Performance Optimization

### Memory Allocation
- Current: 2048MB
- Monitor actual usage in CloudWatch
- Adjust based on librosa requirements

### Timeout Configuration
- Current: 60 seconds
- Covers download (30s) + analysis (20s) + buffer (10s)

### Cold Start Optimization
- Keep dependencies minimal
- Use Lambda layers for large packages
- Consider provisioned concurrency for production

## Troubleshooting

### Issue: yt-dlp not found
**Solution**: Ensure YtdlpLayer is attached and built correctly

### Issue: librosa import error
**Solution**: Ensure PythonLibsLayer is attached and PYTHONPATH is set

### Issue: /tmp full
**Solution**: Verify cleanup logic in finally block

### Issue: Timeout
**Solution**: 
- Check video duration (must be < 5 minutes)
- Increase timeout if needed
- Optimize librosa parameters

### Issue: Memory error
**Solution**: Increase memory allocation (current: 2048MB)

## Migration from Express

### Changes from Express Backend
1. **Handler signature**: `lambda_handler(event, context)` instead of `(req, res)`
2. **Request parsing**: `event['queryStringParameters']` instead of `req.query`
3. **Response format**: Return dict with `statusCode`, `headers`, `body`
4. **File storage**: Use `/tmp` instead of current directory
5. **Subprocess**: Direct Python calls instead of spawning processes

### Maintained Compatibility
- ✅ Same URL validation logic
- ✅ Same duration limit (5 minutes)
- ✅ Same response format
- ✅ Same error messages
- ✅ Same CORS headers

## References

- [AWS Lambda Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [librosa Documentation](https://librosa.org/doc/latest/index.html)
- [Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)

---

**Last Updated**: 2025-11-27
**Status**: Ready for deployment
