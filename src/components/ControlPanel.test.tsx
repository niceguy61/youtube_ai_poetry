import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPanel } from './ControlPanel';

describe('ControlPanel Component', () => {
  it('should render playback controls', () => {
    const mockHandlers = {
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onSeek: vi.fn()
    };
    
    render(
      <ControlPanel
        playbackState="idle"
        currentTime={0}
        duration={180}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByTitle('Play')).toBeInTheDocument();
    expect(screen.getByTitle('Stop')).toBeInTheDocument();
  });

  it('should show pause button when playing', () => {
    const mockHandlers = {
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onSeek: vi.fn()
    };
    
    render(
      <ControlPanel
        playbackState="playing"
        currentTime={30}
        duration={180}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
  });

  it('should call onPlay when play button is clicked', () => {
    const mockHandlers = {
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onSeek: vi.fn()
    };
    
    render(
      <ControlPanel
        playbackState="idle"
        currentTime={0}
        duration={180}
        {...mockHandlers}
      />
    );
    
    const playButton = screen.getByTitle('Play');
    fireEvent.click(playButton);
    
    expect(mockHandlers.onPlay).toHaveBeenCalled();
  });

  it('should display formatted time correctly', () => {
    const mockHandlers = {
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onSeek: vi.fn()
    };
    
    render(
      <ControlPanel
        playbackState="playing"
        currentTime={65}
        duration={180}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('should disable controls when no audio is loaded', () => {
    const mockHandlers = {
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onSeek: vi.fn()
    };
    
    render(
      <ControlPanel
        playbackState="idle"
        currentTime={0}
        duration={0}
        {...mockHandlers}
      />
    );
    
    const playButton = screen.getByTitle('Play');
    expect(playButton).toBeDisabled();
  });

  it('should show correct status indicator', () => {
    const mockHandlers = {
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onSeek: vi.fn()
    };
    
    const { rerender } = render(
      <ControlPanel
        playbackState="playing"
        currentTime={0}
        duration={180}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText('▶ Playing')).toBeInTheDocument();
    
    rerender(
      <ControlPanel
        playbackState="paused"
        currentTime={0}
        duration={180}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText('⏸ Paused')).toBeInTheDocument();
  });
});
