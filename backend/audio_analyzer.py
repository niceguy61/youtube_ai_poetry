#!/usr/bin/env python3
"""
Audio Analysis Script using librosa
Analyzes audio files and extracts comprehensive features for poetry generation
"""

import sys
import json
import librosa
import numpy as np
import warnings
warnings.filterwarnings('ignore')

def analyze_audio(audio_path):
    """
    Analyze audio file and extract comprehensive features
    
    Args:
        audio_path: Path to the audio file
        
    Returns:
        Dictionary containing audio features
    """
    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=22050, duration=300)  # Max 5 minutes
        
        # Basic info
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Tempo and beat tracking
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]
        
        # MFCC (Mel-frequency cepstral coefficients)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        
        # Chroma features (key detection)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        
        # RMS Energy
        rms = librosa.feature.rms(y=y)[0]
        
        # Estimate key
        chroma_vals = np.sum(chroma, axis=1)
        key_index = np.argmax(chroma_vals)
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        estimated_key = keys[key_index]
        
        # Calculate overall statistics
        features = {
            'duration': float(duration),
            'tempo': float(tempo),
            'key': estimated_key,
            'energy': float(np.mean(rms)),
            'energy_variance': float(np.var(rms)),
            'spectral_centroid': float(np.mean(spectral_centroids)),
            'spectral_centroid_variance': float(np.var(spectral_centroids)),
            'spectral_rolloff': float(np.mean(spectral_rolloff)),
            'zero_crossing_rate': float(np.mean(zero_crossing_rate)),
            'mfcc_mean': [float(x) for x in np.mean(mfccs, axis=1).tolist()],
            'mfcc_variance': [float(x) for x in np.var(mfccs, axis=1).tolist()],
            
            # Derived features for poetry
            'valence': calculate_valence(chroma_vals, tempo, np.mean(rms)),
            'intensity': calculate_intensity(np.mean(rms), tempo),
            'complexity': calculate_complexity(np.var(spectral_centroids), np.var(mfccs)),
            'mood': determine_mood(tempo, np.mean(rms), chroma_vals)
        }
        
        return {
            'success': True,
            'features': features
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def calculate_valence(chroma_vals, tempo, energy):
    """Calculate emotional valence (positivity) from audio features"""
    # Major keys tend to be more positive
    major_keys = [0, 2, 4, 5, 7, 9, 11]  # C, D, E, F, G, A, B
    key_index = np.argmax(chroma_vals)
    is_major = key_index in major_keys
    
    # Higher tempo and energy often correlate with positive valence
    tempo_factor = min(tempo / 180.0, 1.0)  # Normalize to 0-1
    energy_factor = min(energy * 10, 1.0)  # Normalize to 0-1
    
    valence = (0.4 if is_major else 0.2) + (tempo_factor * 0.3) + (energy_factor * 0.3)
    return float(np.clip(valence, 0, 1))

def calculate_intensity(energy, tempo):
    """Calculate overall intensity of the music"""
    energy_factor = min(energy * 10, 1.0)
    tempo_factor = min(tempo / 180.0, 1.0)
    intensity = (energy_factor * 0.6) + (tempo_factor * 0.4)
    return float(np.clip(intensity, 0, 1))

def calculate_complexity(spectral_variance, mfcc_variance):
    """Calculate musical complexity"""
    # Higher variance in spectral and timbral features indicates complexity
    spectral_factor = min(spectral_variance / 1000000, 1.0)
    mfcc_factor = min(np.mean(mfcc_variance) / 100, 1.0)
    complexity = (spectral_factor * 0.5) + (mfcc_factor * 0.5)
    return float(np.clip(complexity, 0, 1))

def determine_mood(tempo, energy, chroma_vals):
    """Determine overall mood category"""
    key_index = np.argmax(chroma_vals)
    major_keys = [0, 2, 4, 5, 7, 9, 11]
    is_major = key_index in major_keys
    
    if tempo > 140 and energy > 0.15:
        return 'energetic' if is_major else 'intense'
    elif tempo > 100 and energy > 0.1:
        return 'upbeat' if is_major else 'dramatic'
    elif tempo < 80:
        return 'calm' if is_major else 'melancholic'
    else:
        return 'moderate' if is_major else 'contemplative'

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python audio_analyzer.py <audio_file_path>'
        }))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    result = analyze_audio(audio_path)
    print(json.dumps(result))
