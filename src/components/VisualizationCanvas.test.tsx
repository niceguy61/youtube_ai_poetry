import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisualizationCanvas } from './VisualizationCanvas';

describe('VisualizationCanvas Component', () => {
  it('should render all visualization mode options', () => {
    const onModeChange = vi.fn();
    const onCanvasReady = vi.fn();
    
    render(
      <VisualizationCanvas
        mode="gradient"
        onModeChange={onModeChange}
        onCanvasReady={onCanvasReady}
      />
    );
    
    expect(screen.getByText('Gradient')).toBeInTheDocument();
    expect(screen.getByText('Equalizer')).toBeInTheDocument();
    expect(screen.getByText('Spotlight')).toBeInTheDocument();
    expect(screen.getByText('Combined')).toBeInTheDocument();
  });

  it('should highlight the current mode', () => {
    const onModeChange = vi.fn();
    const onCanvasReady = vi.fn();
    
    render(
      <VisualizationCanvas
        mode="equalizer"
        onModeChange={onModeChange}
        onCanvasReady={onCanvasReady}
      />
    );
    
    const equalizerButton = screen.getByText('Equalizer').closest('button');
    expect(equalizerButton).toHaveClass('bg-purple-600');
  });

  it('should call onModeChange when a mode is selected', () => {
    const onModeChange = vi.fn();
    const onCanvasReady = vi.fn();
    
    render(
      <VisualizationCanvas
        mode="gradient"
        onModeChange={onModeChange}
        onCanvasReady={onCanvasReady}
      />
    );
    
    const spotlightButton = screen.getByText('Spotlight');
    fireEvent.click(spotlightButton);
    
    expect(onModeChange).toHaveBeenCalledWith('spotlight');
  });

  it('should show live indicator when playing', () => {
    const onModeChange = vi.fn();
    const onCanvasReady = vi.fn();
    
    render(
      <VisualizationCanvas
        mode="gradient"
        onModeChange={onModeChange}
        onCanvasReady={onCanvasReady}
        isPlaying={true}
      />
    );
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should show placeholder when not playing', () => {
    const onModeChange = vi.fn();
    const onCanvasReady = vi.fn();
    
    render(
      <VisualizationCanvas
        mode="gradient"
        onModeChange={onModeChange}
        onCanvasReady={onCanvasReady}
        isPlaying={false}
      />
    );
    
    expect(screen.getByText('Load audio to start visualization')).toBeInTheDocument();
  });
});
