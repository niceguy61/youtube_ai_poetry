#!/usr/bin/env python3
"""
YouTube Processing Lambda Function
Handles YouTube video info extraction and audio analysis using yt-dlp and librosa
"""

import json
import subprocess
import os
import tempfile
import traceback
from urllib.parse import urlparse, parse_qs
from audio_analyzer import analyze_audio


def lambda_handler(event, context):
    """
    Main Lambda handler for YouTube processing
    Routes to appropriate handler based on path
    """
    try:
        # Parse the request path
        path = event.get('path', '')
        query_params = event.get('queryStringParameters') or {}
        
        print(f'[YouTube Lambda] Path: {path}')
        print(f'[YouTube Lambda] Query params: {query_params}')
        
        # Route to appropriate handler
        if path.endswith('/info'):
            return handle_youtube_info(query_params)
        elif path.endswith('/audio-with-analysis'):
            return handle_youtube_audio_with_analysis(query_params)
        else:
            return error_response(404, 'Endpoint not found')
            
    except Exception as e:
        print(f'[YouTube Lambda] Unexpected error: {str(e)}')
        traceback.print_exc()
        return error_response(500, f'Internal server error: {str(e)}')


def handle_youtube_info(query_params):
    """
    Get YouTube video information
    GET /api/youtube/info?url=<youtube_url>
    """
    try:
        url = query_params.get('url')
        
        if not url:
            return error_response(400, 'URL parameter is required')
        
        if not is_valid_youtube_url(url):
            return error_response(400, 'Invalid YouTube URL')
        
        print(f'[YouTube Info] Fetching info for: {url}')
        
        # Use yt-dlp to get video info
        result = subprocess.run(
            ['yt-dlp', '--dump-json', '--no-playlist', url],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f'[YouTube Info] Error: {result.stderr}')
            return error_response(500, 'Failed to fetch video information', result.stderr)
        
        # Parse video info
        video_info = json.loads(result.stdout)
        duration = video_info.get('duration', 0)
        
        # Check duration (5 minute limit = 300 seconds)
        if duration > 300:
            return error_response(400, 'Video duration exceeds 5 minute limit', {
                'duration': duration,
                'maxDuration': 300
            })
        
        # Return formatted response
        response_data = {
            'title': video_info.get('title', 'Unknown'),
            'duration': duration,
            'thumbnail': video_info.get('thumbnail', ''),
            'author': video_info.get('uploader') or video_info.get('channel', 'Unknown'),
            'url': video_info.get('webpage_url', url)
        }
        
        print(f'[YouTube Info] Success - Duration: {duration}s')
        return success_response(response_data)
        
    except subprocess.TimeoutExpired:
        return error_response(504, 'Request timeout')
    except json.JSONDecodeError as e:
        print(f'[YouTube Info] JSON parse error: {str(e)}')
        return error_response(500, 'Failed to parse video information')
    except Exception as e:
        print(f'[YouTube Info] Error: {str(e)}')
        traceback.print_exc()
        return error_response(500, f'Failed to fetch video information: {str(e)}')


def handle_youtube_audio_with_analysis(query_params):
    """
    Download YouTube audio and analyze it with librosa
    GET /api/youtube/audio-with-analysis?url=<youtube_url>
    """
    audio_file = None
    
    try:
        url = query_params.get('url')
        
        if not url:
            return error_response(400, 'URL parameter is required')
        
        if not is_valid_youtube_url(url):
            return error_response(400, 'Invalid YouTube URL')
        
        print(f'[YouTube Audio+Analysis] Processing: {url}')
        
        # First, get video info to check duration
        info_result = subprocess.run(
            ['yt-dlp', '--dump-json', '--no-playlist', url],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if info_result.returncode != 0:
            print(f'[YouTube Audio+Analysis] yt-dlp error: {info_result.stderr}')
            return error_response(500, 'Failed to get video information')
        
        video_info = json.loads(info_result.stdout)
        duration = video_info.get('duration', 0)
        
        if duration > 300:
            return error_response(400, 'Video duration exceeds 5 minute limit', {
                'duration': duration,
                'maxDuration': 300
            })
        
        # Download audio to /tmp
        # Use context.request_id for unique filename
        request_id = context.request_id if context else str(os.getpid())
        audio_file = f'/tmp/audio_{request_id}.mp3'
        
        print(f'[YouTube Audio+Analysis] Downloading to: {audio_file}')
        
        download_result = subprocess.run(
            [
                'yt-dlp',
                '-f', 'bestaudio',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--no-playlist',
                '-o', audio_file,
                url
            ],
            capture_output=True,
            text=True,
            timeout=45
        )
        
        if download_result.returncode != 0:
            print(f'[YouTube Audio+Analysis] Download error (returncode={download_result.returncode}): {download_result.stderr}')
            return error_response(500, 'Failed to download audio', {'stderr': download_result.stderr[:500]})
        
        print(f'[YouTube Audio+Analysis] Download complete, analyzing...')
        
        # Analyze audio with librosa
        print(f'[YouTube Audio+Analysis] Starting audio analysis...')
        analysis_result = analyze_audio(audio_file)
        print(f'[YouTube Audio+Analysis] Analysis result: {analysis_result.get("success")}')
        
        if not analysis_result.get('success'):
            error_msg = analysis_result.get('error', 'Unknown error')
            print(f'[YouTube Audio+Analysis] Analysis failed: {error_msg}')
            return error_response(500, 'Audio analysis failed', error_msg)
        
        features = analysis_result.get('features', {})
        
        print(f'[YouTube Audio+Analysis] Success - Tempo: {features.get("tempo")}, Mood: {features.get("mood")}')
        
        # Return combined response
        response_data = {
            'success': True,
            'videoInfo': {
                'title': video_info.get('title'),
                'duration': video_info.get('duration'),
                'author': video_info.get('uploader'),
                'thumbnail': video_info.get('thumbnail') or f'https://i3.ytimg.com/vi/{video_info.get("id")}/maxresdefault.jpg'
            },
            'analysis': features
        }
        
        return success_response(response_data)
        
    except subprocess.TimeoutExpired:
        return error_response(504, 'Request timeout')
    except Exception as e:
        print(f'[YouTube Audio+Analysis] Error: {str(e)}')
        traceback.print_exc()
        return error_response(500, f'Failed to process: {str(e)}')
    finally:
        # Clean up /tmp file
        if audio_file and os.path.exists(audio_file):
            try:
                os.unlink(audio_file)
                print(f'[YouTube Audio+Analysis] Cleaned up: {audio_file}')
            except Exception as e:
                print(f'[YouTube Audio+Analysis] Cleanup failed: {str(e)}')


def is_valid_youtube_url(url):
    """
    Validates if a URL is a valid YouTube URL
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname.lower() if parsed.hostname else ''
        
        # Check for youtube.com URLs
        if hostname in ['www.youtube.com', 'youtube.com', 'm.youtube.com']:
            return parsed.path == '/watch' and 'v' in parse_qs(parsed.query)
        
        # Check for youtu.be URLs
        if hostname == 'youtu.be':
            return len(parsed.path) > 1
        
        return False
    except Exception:
        return False


def success_response(data):
    """
    Return a successful Lambda response
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }


def error_response(status_code, message, details=None):
    """
    Return an error Lambda response
    """
    body = {'error': message}
    if details:
        body['details'] = details
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }
