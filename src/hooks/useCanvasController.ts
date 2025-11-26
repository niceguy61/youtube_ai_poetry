/**
 * useCanvasController Hook
 * 
 * Custom React hook for managing canvas interactions and elements.
 * Provides a clean interface to the CanvasController core class.
 * 
 * Requirements: All UI-related canvas requirements (4.1, 4.2, 4.5)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CanvasController } from '../core/CanvasController';
import type { CanvasElement, InteractionEvent } from '../types/canvas';

export interface UseCanvasControllerReturn {
  // State
  elements: CanvasElement[];
  isInitialized: boolean;

  // Actions
  initialize: (canvas: HTMLCanvasElement) => void;
  addElement: (element: CanvasElement) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  clearCanvas: () => void;
  getElementAtPosition: (position: { x: number; y: number }) => CanvasElement | undefined;
  onInteraction: (callback: (event: InteractionEvent) => void) => () => void;

  // Controller instance (for advanced use cases)
  canvasController: CanvasController | null;
}

/**
 * Hook for managing canvas interactions and elements
 * 
 * @returns Canvas controller state and control functions
 */
export function useCanvasController(): UseCanvasControllerReturn {
  const controllerRef = useRef<CanvasController | null>(null);
  
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize CanvasController on mount
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new CanvasController();
    }

    // Cleanup on unmount
    return () => {
      if (controllerRef.current) {
        controllerRef.current.cleanup();
        controllerRef.current = null;
      }
    };
  }, []);

  // Sync elements from controller
  const syncElements = useCallback(() => {
    if (controllerRef.current && isInitialized) {
      setElements(controllerRef.current.getElements());
    }
  }, [isInitialized]);

  // Initialize with canvas
  const initialize = useCallback((canvas: HTMLCanvasElement) => {
    if (!controllerRef.current) return;

    try {
      controllerRef.current.initialize(canvas);
      setIsInitialized(true);
      syncElements();
    } catch (err) {
      console.error('[useCanvasController] Initialization error:', err);
    }
  }, [syncElements]);

  // Add element
  const addElement = useCallback((element: CanvasElement) => {
    if (!controllerRef.current || !isInitialized) return;

    try {
      controllerRef.current.addElement(element);
      syncElements();
    } catch (err) {
      console.error('[useCanvasController] Add element error:', err);
    }
  }, [isInitialized, syncElements]);

  // Remove element
  const removeElement = useCallback((id: string) => {
    if (!controllerRef.current || !isInitialized) return;

    try {
      controllerRef.current.removeElement(id);
      syncElements();
    } catch (err) {
      console.error('[useCanvasController] Remove element error:', err);
    }
  }, [isInitialized, syncElements]);

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    if (!controllerRef.current || !isInitialized) return;

    try {
      controllerRef.current.updateElement(id, updates);
      syncElements();
    } catch (err) {
      console.error('[useCanvasController] Update element error:', err);
    }
  }, [isInitialized, syncElements]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!controllerRef.current || !isInitialized) return;

    try {
      controllerRef.current.clearCanvas();
      syncElements();
    } catch (err) {
      console.error('[useCanvasController] Clear canvas error:', err);
    }
  }, [isInitialized, syncElements]);

  // Get element at position
  const getElementAtPosition = useCallback((position: { x: number; y: number }) => {
    if (!controllerRef.current || !isInitialized) return undefined;

    try {
      return controllerRef.current.getElementAtPosition(position);
    } catch (err) {
      console.error('[useCanvasController] Get element at position error:', err);
      return undefined;
    }
  }, [isInitialized]);

  // Subscribe to interaction events
  const onInteraction = useCallback((callback: (event: InteractionEvent) => void) => {
    if (!controllerRef.current || !isInitialized) {
      // Return no-op unsubscribe function
      return () => {};
    }

    try {
      return controllerRef.current.onInteraction(callback);
    } catch (err) {
      console.error('[useCanvasController] On interaction error:', err);
      return () => {};
    }
  }, [isInitialized]);

  return {
    // State
    elements,
    isInitialized,

    // Actions
    initialize,
    addElement,
    removeElement,
    updateElement,
    clearCanvas,
    getElementAtPosition,
    onInteraction,

    // Controller instance
    canvasController: controllerRef.current,
  };
}
