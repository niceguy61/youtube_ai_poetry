/**
 * Tests for StorytellingManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorytellingManager, type AnalysisStage, type NarrativeStyle, type ExperienceSummary } from './StorytellingManager';

describe('StorytellingManager', () => {
  let manager: StorytellingManager;

  beforeEach(() => {
    manager = new StorytellingManager();
  });

  describe('Narrative Style Management', () => {
    it('should default to descriptive narrative style', () => {
      expect(manager.getNarrativeStyle()).toBe('descriptive');
    });

    it('should allow setting narrative style', () => {
      manager.setNarrativeStyle('poetic');
      expect(manager.getNarrativeStyle()).toBe('poetic');

      manager.setNarrativeStyle('minimal');
      expect(manager.getNarrativeStyle()).toBe('minimal');

      manager.setNarrativeStyle('technical');
      expect(manager.getNarrativeStyle()).toBe('technical');
    });
  });

  describe('Message Subscription', () => {
    it('should allow subscribing to messages', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onMessage(callback);

      manager.showIntroduction();
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.showIntroduction();
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should support multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.onMessage(callback1);
      manager.onMessage(callback2);

      manager.showIntroduction();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should emit messages with correct structure', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.showIntroduction();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'introduction',
          content: expect.any(String),
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('showIntroduction - Requirement 7.1', () => {
    it('should emit introduction message', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.showIntroduction();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'introduction',
          content: expect.any(String)
        })
      );
    });

    it('should provide different content for each narrative style', () => {
      const styles: NarrativeStyle[] = ['minimal', 'descriptive', 'poetic', 'technical'];
      const contents: string[] = [];

      styles.forEach(style => {
        manager.setNarrativeStyle(style);
        const callback = vi.fn();
        manager.onMessage(callback);
        manager.showIntroduction();
        
        const call = callback.mock.calls[0][0];
        contents.push(call.content);
      });

      // All contents should be unique
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(styles.length);
    });

    it('should include welcome message in descriptive style', () => {
      manager.setNarrativeStyle('descriptive');
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.showIntroduction();

      const message = callback.mock.calls[0][0];
      expect(message.content.toLowerCase()).toContain('welcome');
    });
  });

  describe('showAnalysisMessage - Requirement 7.2', () => {
    it('should emit analysis message for each stage', () => {
      const stages: AnalysisStage[] = ['loading', 'validating', 'analyzing', 'generating', 'ready'];
      
      stages.forEach(stage => {
        const callback = vi.fn();
        manager.onMessage(callback);

        manager.showAnalysisMessage(stage);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'analysis',
            content: expect.any(String)
          })
        );
      });
    });

    it('should provide different content for each stage', () => {
      const stages: AnalysisStage[] = ['loading', 'validating', 'analyzing', 'generating', 'ready'];
      const contents: string[] = [];

      stages.forEach(stage => {
        const callback = vi.fn();
        manager.onMessage(callback);
        manager.showAnalysisMessage(stage);
        
        const call = callback.mock.calls[0][0];
        contents.push(call.content);
      });

      // All contents should be unique
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(stages.length);
    });

    it('should adapt content based on narrative style', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.setNarrativeStyle('minimal');
      manager.showAnalysisMessage('analyzing');
      const minimalContent = callback.mock.calls[0][0].content;

      callback.mockClear();
      manager.setNarrativeStyle('poetic');
      manager.showAnalysisMessage('analyzing');
      const poeticContent = callback.mock.calls[0][0].content;

      expect(minimalContent).not.toBe(poeticContent);
      expect(poeticContent.length).toBeGreaterThan(minimalContent.length);
    });
  });

  describe('showTransition - Requirement 7.3', () => {
    it('should emit transition message', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.showTransition('loading', 'ready');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'transition',
          content: expect.any(String)
        })
      );
    });

    it('should include from and to states in content', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.showTransition('gradient', 'equalizer');

      const message = callback.mock.calls[0][0];
      expect(message.content.toLowerCase()).toContain('gradient');
      expect(message.content.toLowerCase()).toContain('equalizer');
    });

    it('should adapt transition message to narrative style', () => {
      const styles: NarrativeStyle[] = ['minimal', 'descriptive', 'poetic', 'technical'];
      const contents: string[] = [];

      styles.forEach(style => {
        manager.setNarrativeStyle(style);
        const callback = vi.fn();
        manager.onMessage(callback);
        manager.showTransition('mode1', 'mode2');
        
        const call = callback.mock.calls[0][0];
        contents.push(call.content);
      });

      // All contents should be unique
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(styles.length);
    });
  });

  describe('showGuidanceHint - Requirement 7.4', () => {
    it('should emit guidance message', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.showGuidanceHint('Click on the canvas to interact');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'guidance',
          content: expect.any(String)
        })
      );
    });

    it('should include the hint in the content', () => {
      const callback = vi.fn();
      manager.onMessage(callback);
      const hint = 'Try dragging elements around';

      manager.showGuidanceHint(hint);

      const message = callback.mock.calls[0][0];
      expect(message.content).toContain(hint);
    });

    it('should format hint based on narrative style', () => {
      const hint = 'Explore the canvas';
      
      manager.setNarrativeStyle('minimal');
      const callback1 = vi.fn();
      manager.onMessage(callback1);
      manager.showGuidanceHint(hint);
      const minimalContent = callback1.mock.calls[0][0].content;

      manager.setNarrativeStyle('poetic');
      const callback2 = vi.fn();
      manager.onMessage(callback2);
      manager.showGuidanceHint(hint);
      const poeticContent = callback2.mock.calls[0][0].content;

      expect(minimalContent).not.toBe(poeticContent);
    });
  });

  describe('showSummary - Requirement 7.5', () => {
    it('should emit summary message', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const summary: ExperienceSummary = {
        duration: 180,
        poemsGenerated: 5,
        interactionsCount: 12,
        visualizationMode: 'gradient',
        highlights: ['Beautiful gradient transition', 'Energetic poetry generated']
      };

      manager.showSummary(summary);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'summary',
          content: expect.any(String)
        })
      );
    });

    it('should include all summary data in content', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const summary: ExperienceSummary = {
        duration: 240,
        poemsGenerated: 8,
        interactionsCount: 15,
        visualizationMode: 'equalizer',
        highlights: ['Peak moment at 2:30']
      };

      manager.showSummary(summary);

      const message = callback.mock.calls[0][0];
      expect(message.content).toContain('8'); // poems
      expect(message.content).toContain('15'); // interactions
      expect(message.content.toLowerCase()).toContain('equalizer');
    });

    it('should format duration correctly', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const summary: ExperienceSummary = {
        duration: 125, // 2:05
        poemsGenerated: 3,
        interactionsCount: 7,
        visualizationMode: 'spotlight',
        highlights: []
      };

      manager.showSummary(summary);

      const message = callback.mock.calls[0][0];
      expect(message.content).toContain('2:05');
    });

    it('should include highlights when present', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const summary: ExperienceSummary = {
        duration: 180,
        poemsGenerated: 5,
        interactionsCount: 10,
        visualizationMode: 'ai-image',
        highlights: ['First highlight', 'Second highlight']
      };

      manager.showSummary(summary);

      const message = callback.mock.calls[0][0];
      expect(message.content).toContain('First highlight');
      expect(message.content).toContain('Second highlight');
    });

    it('should handle empty highlights gracefully', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const summary: ExperienceSummary = {
        duration: 60,
        poemsGenerated: 2,
        interactionsCount: 3,
        visualizationMode: 'gradient',
        highlights: []
      };

      expect(() => manager.showSummary(summary)).not.toThrow();
      expect(callback).toHaveBeenCalled();
    });

    it('should adapt summary format to narrative style', () => {
      const summary: ExperienceSummary = {
        duration: 180,
        poemsGenerated: 5,
        interactionsCount: 10,
        visualizationMode: 'gradient',
        highlights: ['Highlight 1']
      };

      const styles: NarrativeStyle[] = ['minimal', 'descriptive', 'poetic', 'technical'];
      const contents: string[] = [];

      styles.forEach(style => {
        manager.setNarrativeStyle(style);
        const callback = vi.fn();
        manager.onMessage(callback);
        manager.showSummary(summary);
        
        const call = callback.mock.calls[0][0];
        contents.push(call.content);
      });

      // All contents should be unique
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(styles.length);
    });
  });

  describe('Message Timestamps', () => {
    it('should include timestamp in all messages', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const beforeTime = Date.now();
      manager.showIntroduction();
      const afterTime = Date.now();

      const message = callback.mock.calls[0][0];
      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should have different timestamps for sequential messages', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      manager.showIntroduction();
      const timestamp1 = callback.mock.calls[0][0].timestamp;

      // Small delay to ensure different timestamp
      const delay = () => new Promise(resolve => setTimeout(resolve, 1));
      return delay().then(() => {
        manager.showAnalysisMessage('loading');
        const timestamp2 = callback.mock.calls[1][0].timestamp;

        expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle unsubscribe of non-existent callback gracefully', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onMessage(callback);
      
      unsubscribe();
      unsubscribe(); // Call again

      expect(() => manager.showIntroduction()).not.toThrow();
    });

    it('should handle zero duration in summary', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const summary: ExperienceSummary = {
        duration: 0,
        poemsGenerated: 0,
        interactionsCount: 0,
        visualizationMode: 'gradient',
        highlights: []
      };

      expect(() => manager.showSummary(summary)).not.toThrow();
      const message = callback.mock.calls[0][0];
      expect(message.content).toContain('0:00');
    });

    it('should handle very long duration in summary', () => {
      const callback = vi.fn();
      manager.onMessage(callback);

      const summary: ExperienceSummary = {
        duration: 299, // 4:59 (just under 5 minute limit)
        poemsGenerated: 10,
        interactionsCount: 50,
        visualizationMode: 'combined',
        highlights: []
      };

      manager.showSummary(summary);
      const message = callback.mock.calls[0][0];
      expect(message.content).toContain('4:59');
    });
  });
});
