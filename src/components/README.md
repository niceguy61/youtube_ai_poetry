# React UI Components

This directory contains all the React UI components for the Music Poetry Canvas application.

## Components Overview

### AudioInput
**Purpose**: Handles audio source selection (file upload or URL/YouTube input)

**Features**:
- Toggle between file upload and URL input modes
- File upload with drag-and-drop support
- URL/YouTube link input with validation
- Loading state indication
- Supports MP3 and OGG formats

**Props**:
- `onFileSelect: (file: File) => void` - Callback when file is selected
- `onUrlSubmit: (url: string) => void` - Callback when URL is submitted
- `isLoading?: boolean` - Loading state indicator

### VisualizationCanvas
**Purpose**: Displays real-time audio visualizations with mode selection

**Features**:
- Multiple visualization modes (Gradient, Equalizer, Spotlight, AI Image, Combined)
- Mode selector with visual indicators
- Live playback indicator
- Responsive canvas sizing (16:9 aspect ratio)
- Placeholder when no audio is playing

**Props**:
- `mode: VisualizationMode` - Current visualization mode
- `onModeChange: (mode: VisualizationMode) => void` - Mode change callback
- `onCanvasReady: (canvas: HTMLCanvasElement) => void` - Canvas initialization callback
- `isPlaying?: boolean` - Playback state indicator

### PoetryDisplay
**Purpose**: Shows AI-generated poetry with animated text reveal

**Features**:
- Animated text reveal effect (typewriter style)
- Current poem display with large, readable text
- Poetry history with timestamps and mood indicators
- Expandable history items on hover
- Generation loading state
- Empty state placeholder

**Props**:
- `poems: Poem[]` - Array of generated poems
- `currentPoem?: string` - Currently displayed poem text
- `isGenerating?: boolean` - Poetry generation state

### InteractiveCanvas
**Purpose**: Provides interactive canvas for user interactions

**Features**:
- Click, drag, and hover interaction support
- Touch event support for mobile devices
- Real-time coordinate tracking
- Visual feedback for interactions
- Enable/disable state management
- Crosshair cursor when enabled

**Props**:
- `onInteraction: (event: InteractionEvent) => void` - Interaction event callback
- `isEnabled?: boolean` - Enable/disable interactions

### ControlPanel
**Purpose**: Audio playback controls and progress tracking

**Features**:
- Play/Pause/Stop controls
- Seek bar with time display
- Volume control slider
- Formatted time display (MM:SS)
- Playback state indicators
- Disabled state when no audio loaded
- Loading spinner during audio loading

**Props**:
- `playbackState: PlaybackState` - Current playback state
- `currentTime: number` - Current playback position in seconds
- `duration: number` - Total audio duration in seconds
- `onPlay: () => void` - Play callback
- `onPause: () => void` - Pause callback
- `onStop: () => void` - Stop callback
- `onSeek: (time: number) => void` - Seek callback
- `volume?: number` - Volume level (0-1)
- `onVolumeChange?: (volume: number) => void` - Volume change callback

### ExportPanel
**Purpose**: Export and sharing functionality

**Features**:
- Poetry export in multiple formats (txt, json, markdown)
- Canvas export as images (png, jpg)
- Complete experience export
- Share URL generation with clipboard copy
- Format selection for each export type
- Export state indication
- Disabled state when no content available

**Props**:
- `onExportPoetry: (format: 'txt' | 'json' | 'markdown') => void` - Poetry export callback
- `onExportCanvas: (format: 'png' | 'jpg') => void` - Canvas export callback
- `onExportExperience: () => void` - Complete experience export callback
- `onGenerateShareURL: () => void` - Share URL generation callback
- `hasPoetry?: boolean` - Poetry availability indicator
- `hasCanvas?: boolean` - Canvas availability indicator
- `isExporting?: boolean` - Export state indicator

## Integration

All components are integrated in the main `App.tsx` component with a responsive grid layout:

```tsx
import {
  AudioInput,
  VisualizationCanvas,
  PoetryDisplay,
  InteractiveCanvas,
  ControlPanel,
  ExportPanel
} from './components';
```

### Layout Structure

- **Left Column**: AudioInput, ControlPanel, ExportPanel
- **Middle/Right Column**: VisualizationCanvas, InteractiveCanvas, PoetryDisplay

## Styling

All components use:
- Tailwind CSS for styling
- Glassmorphism design (backdrop-blur, semi-transparent backgrounds)
- Purple/blue gradient theme
- Responsive design
- Smooth transitions and animations
- Accessibility-friendly focus states

## Testing

Each component has comprehensive unit tests covering:
- Rendering and display
- User interactions
- State management
- Prop handling
- Edge cases

Run tests with:
```bash
npm test -- src/components/
```

## Future Enhancements

The components are designed with placeholders for future integration:
- AudioManager integration for actual audio playback
- VisualizationEngine integration for real-time rendering
- PoetryGenerator integration for AI-powered poetry
- CanvasController integration for interactive elements
- ExportManager integration for file exports
- StorytellingManager integration for narrative elements

## Requirements Validation

These components satisfy the following requirements:
- **1.1**: File upload support (AudioInput)
- **1.2**: URL input support (AudioInput)
- **2.1**: Real-time visualization display (VisualizationCanvas)
- **3.3**: Poetry display on canvas (PoetryDisplay)
- **4.1**: Canvas interaction handling (InteractiveCanvas)
- **9.1**: Poetry export (ExportPanel)
- **9.2**: Canvas export (ExportPanel)
