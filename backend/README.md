# YouTube Audio Extraction Backend

This is a Node.js/Express backend service that provides YouTube audio extraction functionality for the Music Poetry Canvas application.

## Features

- Extract audio from YouTube videos
- Enforce 5-minute duration limit
- Stream audio directly to frontend
- Get video metadata (title, duration, thumbnail, author)
- CORS enabled for frontend integration

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` to configure:
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### Health Check
```
GET /health
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "service": "youtube-audio-extractor"
}
```

### Get Video Information
```
GET /api/youtube/info?url=<youtube_url>
```

Get metadata about a YouTube video.

**Query Parameters:**
- `url` (required): YouTube video URL

**Response:**
```json
{
  "title": "Video Title",
  "duration": 180,
  "thumbnail": "https://...",
  "author": "Channel Name",
  "url": "https://youtube.com/watch?v=..."
}
```

**Error Response (duration > 5 minutes):**
```json
{
  "error": "Video duration exceeds 5 minute limit",
  "duration": 360,
  "maxDuration": 300
}
```

### Stream Audio
```
GET /api/youtube/audio?url=<youtube_url>
```

Stream audio data from a YouTube video.

**Query Parameters:**
- `url` (required): YouTube video URL

**Response:**
- Content-Type: `audio/webm`
- Audio stream data

**Error Response:**
```json
{
  "error": "Failed to extract audio",
  "message": "Error details"
}
```

## Integration with Frontend

Update your frontend configuration to point to this backend:

```typescript
// In src/config/config.ts or .env
VITE_YOUTUBE_API_URL=http://localhost:3001
```

The `YouTubeExtractor` service in the frontend will use these endpoints.

## Dependencies

- **express**: Web server framework
- **cors**: Enable CORS for frontend requests
- **ytdl-core**: YouTube video/audio downloader

## Error Handling

The server handles various error cases:
- Invalid YouTube URLs
- Videos exceeding 5-minute duration limit
- Network errors during download
- Stream errors

All errors return appropriate HTTP status codes and error messages.

## Development Notes

- The server uses ES modules (`type: "module"` in package.json)
- Audio is streamed in real-time (not downloaded completely first)
- High water mark is set to 32MB for smooth streaming
- CORS is configured to allow requests from the frontend

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Configure `FRONTEND_URL` to your production frontend URL
3. Consider using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name youtube-backend
   ```
4. Set up reverse proxy (nginx/Apache) if needed
5. Enable HTTPS for secure connections

## Troubleshooting

### "Invalid YouTube URL" error
- Ensure the URL is a valid YouTube video URL
- Supported formats: `youtube.com/watch?v=...`, `youtu.be/...`

### "Video duration exceeds 5 minute limit"
- The application enforces a 5-minute limit for AI analysis
- Choose shorter videos or trim longer ones

### CORS errors
- Check that `FRONTEND_URL` in `.env` matches your frontend URL
- Ensure the backend server is running

### Stream errors
- Check your internet connection
- Some videos may be restricted or unavailable
- Try a different video

## License

MIT
