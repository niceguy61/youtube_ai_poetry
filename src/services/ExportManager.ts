/**
 * ExportManager - Handles exporting and sharing of created experiences
 * 
 * Provides functionality to:
 * - Export poetry in multiple formats (txt, json, markdown)
 * - Export canvas as images (png, jpg)
 * - Export complete experience data
 * - Generate shareable URLs with encoded experience data
 * - Load experiences from share URLs
 */

import type { ExperienceData } from '../types/export';

export class ExportManager {
  /**
   * Export poetry in the specified format
   * @param poems - Array of poetry strings to export
   * @param format - Output format (txt, json, markdown)
   * @returns Blob containing the formatted poetry
   */
  async exportPoetry(poems: string[], format: 'txt' | 'json' | 'markdown'): Promise<Blob> {
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'txt':
        content = this.formatPoetryAsText(poems);
        mimeType = 'text/plain';
        break;
      
      case 'json':
        content = this.formatPoetryAsJson(poems);
        mimeType = 'application/json';
        break;
      
      case 'markdown':
        content = this.formatPoetryAsMarkdown(poems);
        mimeType = 'text/markdown';
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return new Blob([content], { type: mimeType });
  }

  /**
   * Export canvas as an image
   * @param canvas - HTML canvas element to export
   * @param format - Image format (png, jpg)
   * @returns Blob containing the image data
   */
  async exportCanvas(canvas: HTMLCanvasElement, format: 'png' | 'jpg'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpg' ? 0.95 : undefined;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export complete experience data
   * @param experience - Experience data to export
   * @returns Experience data object
   */
  async exportExperience(experience: ExperienceData): Promise<ExperienceData> {
    // Validate experience data
    this.validateExperienceData(experience);
    
    // Return a deep copy to prevent mutations
    return JSON.parse(JSON.stringify(experience));
  }

  /**
   * Generate a shareable URL with encoded experience data
   * @param experience - Experience data to encode
   * @returns URL string with encoded data
   */
  async generateShareURL(experience: ExperienceData): Promise<string> {
    // Validate experience data
    this.validateExperienceData(experience);

    // Serialize and encode the experience data
    const jsonString = JSON.stringify(experience);
    const encoded = this.encodeData(jsonString);

    // Generate URL with encoded data as query parameter
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?share=${encoded}`;

    return shareUrl;
  }

  /**
   * Load experience from a share URL
   * @param url - Share URL containing encoded experience data
   * @returns Decoded experience data
   */
  async loadFromShareURL(url: string): Promise<ExperienceData> {
    try {
      // Parse URL and extract share parameter
      const urlObj = new URL(url);
      const encodedData = urlObj.searchParams.get('share');

      if (!encodedData) {
        throw new Error('No share data found in URL');
      }

      // Decode and parse the experience data
      const jsonString = this.decodeData(encodedData);
      const experience = JSON.parse(jsonString) as ExperienceData;

      // Validate the loaded data
      this.validateExperienceData(experience);

      return experience;
    } catch (error) {
      throw new Error(`Failed to load experience from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format poetry as plain text
   * @private
   */
  private formatPoetryAsText(poems: string[]): string {
    if (poems.length === 0) {
      return 'No poetry generated.';
    }

    return poems
      .map((poem, index) => `Poem ${index + 1}:\n${poem}`)
      .join('\n\n---\n\n');
  }

  /**
   * Format poetry as JSON
   * @private
   */
  private formatPoetryAsJson(poems: string[]): string {
    const data = {
      poems,
      count: poems.length,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Format poetry as Markdown
   * @private
   */
  private formatPoetryAsMarkdown(poems: string[]): string {
    if (poems.length === 0) {
      return '# Poetry Collection\n\nNo poetry generated.';
    }

    const header = '# Poetry Collection\n\n';
    const timestamp = `*Exported: ${new Date().toLocaleString()}*\n\n---\n\n`;
    
    const content = poems
      .map((poem, index) => `## Poem ${index + 1}\n\n${poem}`)
      .join('\n\n---\n\n');

    return header + timestamp + content;
  }

  /**
   * Encode data for URL transmission
   * Uses base64 encoding with URL-safe characters
   * @private
   */
  private encodeData(data: string): string {
    try {
      // Convert to base64
      const base64 = btoa(data);
      
      // Make URL-safe by replacing characters
      return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } catch (error) {
      throw new Error('Failed to encode data');
    }
  }

  /**
   * Decode data from URL
   * @private
   */
  private decodeData(encoded: string): string {
    try {
      // Restore base64 characters
      let base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }

      // Decode from base64
      return atob(base64);
    } catch (error) {
      throw new Error('Failed to decode data');
    }
  }

  /**
   * Validate experience data structure
   * @private
   */
  private validateExperienceData(experience: ExperienceData): void {
    if (!experience) {
      throw new Error('Experience data is required');
    }

    if (!experience.audioSource) {
      throw new Error('Audio source is required');
    }

    if (!['file', 'url', 'youtube'].includes(experience.audioSource.type)) {
      throw new Error('Invalid audio source type');
    }

    if (!experience.audioSource.reference) {
      throw new Error('Audio source reference is required');
    }

    if (!Array.isArray(experience.poems)) {
      throw new Error('Poems must be an array');
    }

    if (!Array.isArray(experience.canvasState)) {
      throw new Error('Canvas state must be an array');
    }

    if (!experience.visualizationConfig) {
      throw new Error('Visualization config is required');
    }

    if (typeof experience.timestamp !== 'number') {
      throw new Error('Timestamp must be a number');
    }
  }
}
