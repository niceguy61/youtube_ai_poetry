import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioInput } from './AudioInput';

describe('AudioInput Component', () => {
  it('should render with Card and Input components', () => {
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onUrlSubmit={onUrlSubmit} />);
    
    // Check for Card header title
    expect(screen.getByText('Audio Source')).toBeInTheDocument();
    
    // Check for Input placeholder
    expect(screen.getByPlaceholderText('Paste a YouTube link and press Enter...')).toBeInTheDocument();
  });

  it('should disable input when loading', () => {
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onUrlSubmit={onUrlSubmit} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Paste a YouTube link and press Enter...');
    expect(input).toBeDisabled();
  });

  it('should show loading spinner when loading', () => {
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onUrlSubmit={onUrlSubmit} isLoading={true} />);
    
    // Check for loading spinner (aria-busy attribute)
    const input = screen.getByPlaceholderText('Paste a YouTube link and press Enter...');
    expect(input).toHaveAttribute('aria-busy', 'true');
  });

  it('should call onUrlSubmit when form is submitted with valid URL', () => {
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onUrlSubmit={onUrlSubmit} />);
    
    // Enter URL
    const input = screen.getByPlaceholderText('Paste a YouTube link and press Enter...');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=test' } });
    
    // Submit form
    const form = input.closest('form');
    fireEvent.submit(form!);
    
    expect(onUrlSubmit).toHaveBeenCalledWith('https://youtube.com/watch?v=test');
  });

  it('should not call onUrlSubmit when form is submitted with empty URL', () => {
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onUrlSubmit={onUrlSubmit} />);
    
    // Submit form without entering URL
    const input = screen.getByPlaceholderText('Paste a YouTube link and press Enter...');
    const form = input.closest('form');
    fireEvent.submit(form!);
    
    expect(onUrlSubmit).not.toHaveBeenCalled();
  });

  it('should trim whitespace from URL before submitting', () => {
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onUrlSubmit={onUrlSubmit} />);
    
    // Enter URL with whitespace
    const input = screen.getByPlaceholderText('Paste a YouTube link and press Enter...');
    fireEvent.change(input, { target: { value: '  https://youtube.com/watch?v=test  ' } });
    
    // Submit form
    const form = input.closest('form');
    fireEvent.submit(form!);
    
    expect(onUrlSubmit).toHaveBeenCalledWith('https://youtube.com/watch?v=test');
  });

  it('should apply custom styling classes', () => {
    const onUrlSubmit = vi.fn();
    
    render(<AudioInput onUrlSubmit={onUrlSubmit} />);
    
    const input = screen.getByPlaceholderText('Paste a YouTube link and press Enter...');
    
    // Check for custom styling classes
    expect(input).toHaveClass('bg-white/5');
    expect(input).toHaveClass('border-white/10');
    expect(input).toHaveClass('focus:ring-primary');
    expect(input).toHaveClass('transition-all');
    expect(input).toHaveClass('duration-300');
  });
});
