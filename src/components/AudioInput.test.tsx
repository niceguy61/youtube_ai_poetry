import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioInput } from './AudioInput';

describe('AudioInput Component', () => {
  it('should render file upload mode by default', () => {
    const onFileSelect = vi.fn();
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onFileSelect={onFileSelect} onUrlSubmit={onUrlSubmit} />);
    
    expect(screen.getByText('Choose Audio File')).toBeInTheDocument();
    expect(screen.getByText('Supports MP3 and OGG (max 5 minutes)')).toBeInTheDocument();
  });

  it('should switch to URL mode when URL button is clicked', () => {
    const onFileSelect = vi.fn();
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onFileSelect={onFileSelect} onUrlSubmit={onUrlSubmit} />);
    
    const urlButton = screen.getByText('URL / YouTube');
    fireEvent.click(urlButton);
    
    expect(screen.getByPlaceholderText('Enter audio URL or YouTube link...')).toBeInTheDocument();
    expect(screen.getByText('Load Audio')).toBeInTheDocument();
  });

  it('should disable inputs when loading', () => {
    const onFileSelect = vi.fn();
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onFileSelect={onFileSelect} onUrlSubmit={onUrlSubmit} isLoading={true} />);
    
    const uploadButton = screen.getByText(/Loading/);
    expect(uploadButton).toBeDisabled();
  });

  it('should call onUrlSubmit when URL form is submitted', () => {
    const onFileSelect = vi.fn();
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onFileSelect={onFileSelect} onUrlSubmit={onUrlSubmit} />);
    
    // Switch to URL mode
    fireEvent.click(screen.getByText('URL / YouTube'));
    
    // Enter URL
    const input = screen.getByPlaceholderText('Enter audio URL or YouTube link...');
    fireEvent.change(input, { target: { value: 'https://example.com/audio.mp3' } });
    
    // Submit form
    const submitButton = screen.getByText('Load Audio');
    fireEvent.click(submitButton);
    
    expect(onUrlSubmit).toHaveBeenCalledWith('https://example.com/audio.mp3');
  });
});
