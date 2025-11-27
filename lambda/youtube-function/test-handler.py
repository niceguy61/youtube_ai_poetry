#!/usr/bin/env python3
"""
Test script for YouTube Lambda handler
Tests the handler logic without SAM local
"""

import json
from handler import lambda_handler

# Test 1: YouTube Info endpoint
print("=" * 60)
print("Test 1: YouTube Info Endpoint")
print("=" * 60)

info_event = {
    'path': '/api/youtube/info',
    'queryStringParameters': {
        'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'  # Rick Astley - Never Gonna Give You Up (short video)
    }
}

try:
    response = lambda_handler(info_event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response Body:")
    body = json.loads(response['body'])
    print(json.dumps(body, indent=2))
except Exception as e:
    print(f"Error: {str(e)}")

print("\n")

# Test 2: Invalid URL
print("=" * 60)
print("Test 2: Invalid URL")
print("=" * 60)

invalid_event = {
    'path': '/api/youtube/info',
    'queryStringParameters': {
        'url': 'https://example.com/video'
    }
}

try:
    response = lambda_handler(invalid_event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response Body:")
    body = json.loads(response['body'])
    print(json.dumps(body, indent=2))
except Exception as e:
    print(f"Error: {str(e)}")

print("\n")

# Test 3: Missing URL parameter
print("=" * 60)
print("Test 3: Missing URL Parameter")
print("=" * 60)

missing_event = {
    'path': '/api/youtube/info',
    'queryStringParameters': {}
}

try:
    response = lambda_handler(missing_event, None)
    print(f"Status Code: {response['statusCode']}")
    print(f"Response Body:")
    body = json.loads(response['body'])
    print(json.dumps(body, indent=2))
except Exception as e:
    print(f"Error: {str(e)}")

print("\n")
print("=" * 60)
print("Tests Complete")
print("=" * 60)
print("\nNote: Audio analysis test requires yt-dlp and librosa to be installed")
print("Run: pip install yt-dlp librosa numpy scipy soundfile audioread")
