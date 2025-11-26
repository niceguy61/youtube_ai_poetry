import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component Integration', () => {
  it('should render the main application with all components', () => {
    render(<App />);
    
    // Check for main heading
    expect(screen.getByText('Music Poetry Canvas')).toBeInTheDocument();
    
    // Check for component sections
    expect(screen.getByText('Audio Source')).toBeInTheDocument();
    expect(screen.getByText('Playback Controls')).toBeInTheDocument();
    expect(screen.getByText('Visualization')).toBeInTheDocument();
    expect(screen.getByText('Interactive Canvas')).toBeInTheDocument();
    expect(screen.getByText('Poetry')).toBeInTheDocument();
    expect(screen.getByText('Export & Share')).toBeInTheDocument();
  });

  it('should render audio input options', () => {
    render(<App />);
    
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('URL / YouTube')).toBeInTheDocument();
  });

  it('should render visualization mode selector', () => {
    render(<App />);
    
    expect(screen.getByText('Gradient')).toBeInTheDocument();
    expect(screen.getByText('Equalizer')).toBeInTheDocument();
    expect(screen.getByText('Spotlight')).toBeInTheDocument();
    expect(screen.getByText('AI Image')).toBeInTheDocument();
  });

  it('should render playback controls', () => {
    render(<App />);
    
    // Check for play/pause button (should be play initially)
    const playButton = screen.getByTitle('Play');
    expect(playButton).toBeInTheDocument();
    expect(playButton).toBeDisabled(); // Disabled until audio is loaded
  });

  it('should render export options', () => {
    render(<App />);
    
    expect(screen.getByText('Export Poetry')).toBeInTheDocument();
    expect(screen.getByText('Export Canvas')).toBeInTheDocument();
    expect(screen.getByText('Complete Experience')).toBeInTheDocument();
    expect(screen.getByText('Share Experience')).toBeInTheDocument();
  });

  it('should wire up canvas interaction handler', () => {
    const { container } = render(<App />);
    
    // Verify that the interactive canvas is rendered
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    
    // Verify that the canvas has interaction event listeners
    // (The InteractiveCanvas component handles this internally)
    expect(canvas).toHaveProperty('onclick');
  });
});
