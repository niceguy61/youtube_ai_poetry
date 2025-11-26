/**
 * ExportManager Usage Examples
 * 
 * This file demonstrates how to use the ExportManager class
 * for exporting poetry, canvas, and complete experiences.
 */

import { ExportManager } from './ExportManager';
import type { ExperienceData } from '../types/export';

// Initialize the export manager
const exportManager = new ExportManager();

// ============================================================================
// Example 1: Export Poetry in Different Formats
// ============================================================================

async function exportPoetryExample() {
  const poems = [
    'Waves crash upon the shore,\nRhythm eternal, forevermore.',
    'Melodies dance through the air,\nColors blend without a care.'
  ];

  // Export as plain text
  const txtBlob = await exportManager.exportPoetry(poems, 'txt');
  downloadBlob(txtBlob, 'poetry.txt');

  // Export as JSON
  const jsonBlob = await exportManager.exportPoetry(poems, 'json');
  downloadBlob(jsonBlob, 'poetry.json');

  // Export as Markdown
  const mdBlob = await exportManager.exportPoetry(poems, 'markdown');
  downloadBlob(mdBlob, 'poetry.md');
}

// ============================================================================
// Example 2: Export Canvas as Image
// ============================================================================

async function exportCanvasExample() {
  // Get canvas element
  const canvas = document.getElementById('visualization-canvas') as HTMLCanvasElement;

  // Export as PNG (lossless)
  const pngBlob = await exportManager.exportCanvas(canvas, 'png');
  downloadBlob(pngBlob, 'canvas.png');

  // Export as JPG (smaller file size)
  const jpgBlob = await exportManager.exportCanvas(canvas, 'jpg');
  downloadBlob(jpgBlob, 'canvas.jpg');
}

// ============================================================================
// Example 3: Export Complete Experience
// ============================================================================

async function exportCompleteExperience() {
  const experience: ExperienceData = {
    audioSource: {
      type: 'file',
      reference: 'my-song.mp3'
    },
    poems: [
      'First generated poem...',
      'Second generated poem...'
    ],
    canvasState: [
      {
        id: 'text-1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: { text: 'Hello World', fontSize: 24 },
        interactive: true
      }
    ],
    visualizationConfig: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFD93D'
      },
      sensitivity: 0.8,
      smoothing: 0.5,
      layers: ['background-gradient', 'equalizer-bars']
    },
    timestamp: Date.now()
  };

  // Export the complete experience data
  const exportedData = await exportManager.exportExperience(experience);
  
  // Convert to JSON and download
  const blob = new Blob([JSON.stringify(exportedData, null, 2)], { 
    type: 'application/json' 
  });
  downloadBlob(blob, 'experience.json');
}

// ============================================================================
// Example 4: Generate and Share URL
// ============================================================================

async function shareExperienceExample() {
  const experience: ExperienceData = {
    audioSource: {
      type: 'youtube',
      reference: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
    },
    poems: ['Shared poem content...'],
    canvasState: [],
    visualizationConfig: {
      colors: {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF'
      },
      sensitivity: 0.7,
      smoothing: 0.6,
      layers: ['background-gradient']
    },
    timestamp: Date.now()
  };

  // Generate shareable URL
  const shareUrl = await exportManager.generateShareURL(experience);
  
  // Copy to clipboard
  await navigator.clipboard.writeText(shareUrl);
  
  return shareUrl;
}

// ============================================================================
// Example 5: Load Experience from Share URL
// ============================================================================

async function loadSharedExperience() {
  // Get share URL from current page or user input
  const currentUrl = window.location.href;
  
  // Check if URL contains share data
  if (currentUrl.includes('?share=')) {
    try {
      const experience = await exportManager.loadFromShareURL(currentUrl);
      
      // Use the loaded data to recreate the experience
      // - Load audio from experience.audioSource
      // - Display poems from experience.poems
      // - Restore canvas state from experience.canvasState
      // - Apply visualization config from experience.visualizationConfig
      
      return experience;
    } catch (error) {
      console.error('Failed to load shared experience:', error);
    }
  }
}

// ============================================================================
// Example 6: Complete Export Workflow in React Component
// ============================================================================

function ExportComponent() {
  const handleExportPoetry = async (poems: string[]) => {
    try {
      const blob = await exportManager.exportPoetry(poems, 'txt');
      downloadBlob(blob, `poetry-${Date.now()}.txt`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export poetry. Please try again.');
    }
  };

  const handleExportCanvas = async (canvas: HTMLCanvasElement) => {
    try {
      const blob = await exportManager.exportCanvas(canvas, 'png');
      downloadBlob(blob, `canvas-${Date.now()}.png`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export canvas. Please try again.');
    }
  };

  const handleShare = async (experience: ExperienceData) => {
    try {
      const shareUrl = await exportManager.generateShareURL(experience);
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to generate share link. Please try again.');
    }
  };

  return null; // Component JSX would go here
}

// ============================================================================
// Utility: Download Blob as File
// ============================================================================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Error Handling Example
// ============================================================================

async function exportWithErrorHandling() {
  try {
    const experience: ExperienceData = {
      audioSource: { type: 'file', reference: 'song.mp3' },
      poems: [],
      canvasState: [],
      visualizationConfig: {
        colors: { primary: '#000', secondary: '#FFF', accent: '#888' },
        sensitivity: 0.5,
        smoothing: 0.5,
        layers: []
      },
      timestamp: Date.now()
    };

    const shareUrl = await exportManager.generateShareURL(experience);
    return shareUrl;
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Audio source')) {
        console.error('Invalid audio source configuration');
      } else if (error.message.includes('encode')) {
        console.error('Failed to encode experience data');
      } else {
        console.error('Unexpected error:', error.message);
      }
    }
    throw error;
  }
}

// Export examples for use in other files
export {
  exportPoetryExample,
  exportCanvasExample,
  exportCompleteExperience,
  shareExperienceExample,
  loadSharedExperience,
  ExportComponent,
  downloadBlob,
  exportWithErrorHandling
};
