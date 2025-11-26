/**
 * useStorytellingManager Hook
 * 
 * Custom React hook for managing storytelling and narrative flow.
 * Provides a clean interface to the StorytellingManager core class.
 * 
 * Requirements: All UI-related storytelling requirements (7.1, 7.2, 7.3, 7.4, 7.5)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StorytellingManager,
  type AnalysisStage,
  type NarrativeStyle,
  type ExperienceSummary,
  type StorytellingMessage,
} from '../core/StorytellingManager';

export interface UseStorytellingManagerReturn {
  // State
  currentMessage: StorytellingMessage | null;
  messageHistory: StorytellingMessage[];
  narrativeStyle: NarrativeStyle;

  // Actions
  showIntroduction: () => void;
  showAnalysisMessage: (stage: AnalysisStage) => void;
  showTransition: (from: string, to: string) => void;
  showGuidanceHint: (hint: string) => void;
  showSummary: (data: ExperienceSummary) => void;
  setNarrativeStyle: (style: NarrativeStyle) => void;
  clearMessages: () => void;

  // Manager instance (for advanced use cases)
  storytellingManager: StorytellingManager | null;
}

/**
 * Hook for managing storytelling and narrative flow
 * 
 * @param initialStyle - Optional initial narrative style
 * @returns Storytelling manager state and control functions
 */
export function useStorytellingManager(
  initialStyle: NarrativeStyle = 'descriptive'
): UseStorytellingManagerReturn {
  const managerRef = useRef<StorytellingManager | null>(null);
  
  const [currentMessage, setCurrentMessage] = useState<StorytellingMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<StorytellingMessage[]>([]);
  const [narrativeStyle, setNarrativeStyleState] = useState<NarrativeStyle>(initialStyle);

  // Initialize StorytellingManager on mount
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new StorytellingManager();
      managerRef.current.setNarrativeStyle(initialStyle);
    }

    const manager = managerRef.current;

    // Subscribe to storytelling messages
    const unsubscribe = manager.onMessage((message: StorytellingMessage) => {
      setCurrentMessage(message);
      setMessageHistory((prev) => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      managerRef.current = null;
    };
  }, [initialStyle]);

  // Show introduction
  const showIntroduction = useCallback(() => {
    if (!managerRef.current) return;

    try {
      managerRef.current.showIntroduction();
    } catch (err) {
      console.error('[useStorytellingManager] Show introduction error:', err);
    }
  }, []);

  // Show analysis message
  const showAnalysisMessage = useCallback((stage: AnalysisStage) => {
    if (!managerRef.current) return;

    try {
      managerRef.current.showAnalysisMessage(stage);
    } catch (err) {
      console.error('[useStorytellingManager] Show analysis message error:', err);
    }
  }, []);

  // Show transition
  const showTransition = useCallback((from: string, to: string) => {
    if (!managerRef.current) return;

    try {
      managerRef.current.showTransition(from, to);
    } catch (err) {
      console.error('[useStorytellingManager] Show transition error:', err);
    }
  }, []);

  // Show guidance hint
  const showGuidanceHint = useCallback((hint: string) => {
    if (!managerRef.current) return;

    try {
      managerRef.current.showGuidanceHint(hint);
    } catch (err) {
      console.error('[useStorytellingManager] Show guidance hint error:', err);
    }
  }, []);

  // Show summary
  const showSummary = useCallback((data: ExperienceSummary) => {
    if (!managerRef.current) return;

    try {
      managerRef.current.showSummary(data);
    } catch (err) {
      console.error('[useStorytellingManager] Show summary error:', err);
    }
  }, []);

  // Set narrative style
  const setNarrativeStyle = useCallback((style: NarrativeStyle) => {
    if (!managerRef.current) return;

    try {
      managerRef.current.setNarrativeStyle(style);
      setNarrativeStyleState(style);
    } catch (err) {
      console.error('[useStorytellingManager] Set narrative style error:', err);
    }
  }, []);

  // Clear message history
  const clearMessages = useCallback(() => {
    setMessageHistory([]);
    setCurrentMessage(null);
  }, []);

  return {
    // State
    currentMessage,
    messageHistory,
    narrativeStyle,

    // Actions
    showIntroduction,
    showAnalysisMessage,
    showTransition,
    showGuidanceHint,
    showSummary,
    setNarrativeStyle,
    clearMessages,

    // Manager instance
    storytellingManager: managerRef.current,
  };
}
