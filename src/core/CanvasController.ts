/**
 * Canvas Controller
 * 
 * Manages user interactions with the interactive canvas, including:
 * - Click, drag, and touch event handling
 * - Canvas element management (add, remove, update)
 * - Hit detection for interactive elements
 * - Z-index based element sorting and layering
 * - Interaction event subscriptions
 * 
 * Requirements: 4.1, 4.2, 4.5
 */

import type { CanvasElement, InteractionEvent } from '../types/canvas';

type InteractionCallback = (event: InteractionEvent) => void;

export class CanvasController {
  private canvas: HTMLCanvasElement | null = null;
  private elements: Map<string, CanvasElement> = new Map();
  private interactionCallbacks: Set<InteractionCallback> = new Set();
  private isDragging = false;
  private draggedElement: CanvasElement | null = null;
  private dragStartPosition: { x: number; y: number } | null = null;
  private initialized = false;

  /**
   * Initialize the canvas controller with a canvas element
   */
  initialize(canvas: HTMLCanvasElement): void {
    if (this.initialized) {
      return;
    }

    this.canvas = canvas;
    this.setupEventListeners();
    this.initialized = true;
  }

  /**
   * Ensure the controller is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.canvas) {
      throw new Error('CanvasController not initialized. Call initialize() first.');
    }
  }

  /**
   * Set up event listeners for mouse and touch interactions
   */
  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Mouse events
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Remove event listeners (cleanup)
   */
  private removeEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Get canvas coordinates from mouse event
   */
  private getCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Get canvas coordinates from touch event
   */
  private getTouchCoordinates(event: TouchEvent): { x: number; y: number } {
    if (!this.canvas || event.touches.length === 0) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    const touch = event.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  /**
   * Handle click events
   */
  private handleClick = (event: MouseEvent): void => {
    const position = this.getCanvasCoordinates(event);
    const element = this.getElementAtPosition(position);

    const interactionEvent: InteractionEvent = {
      type: 'click',
      position,
      element,
      timestamp: Date.now()
    };

    this.emitInteraction(interactionEvent);
  };

  /**
   * Handle mouse down events (start of drag)
   */
  private handleMouseDown = (event: MouseEvent): void => {
    const position = this.getCanvasCoordinates(event);
    const element = this.getElementAtPosition(position);

    if (element && element.interactive) {
      this.isDragging = true;
      this.draggedElement = element;
      this.dragStartPosition = position;
    }
  };

  /**
   * Handle mouse move events (during drag)
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging || !this.draggedElement || !this.dragStartPosition) {
      return;
    }

    const position = this.getCanvasCoordinates(event);
    const deltaX = position.x - this.dragStartPosition.x;
    const deltaY = position.y - this.dragStartPosition.y;

    // Update element position
    const updatedElement: CanvasElement = {
      ...this.draggedElement,
      position: {
        x: this.draggedElement.position.x + deltaX,
        y: this.draggedElement.position.y + deltaY
      }
    };

    // Update bounds if they exist
    if (updatedElement.bounds) {
      updatedElement.bounds = {
        ...updatedElement.bounds,
        x: updatedElement.bounds.x + deltaX,
        y: updatedElement.bounds.y + deltaY
      };
    }

    this.updateElement(this.draggedElement.id, updatedElement);
    this.draggedElement = updatedElement;
    this.dragStartPosition = position;

    const interactionEvent: InteractionEvent = {
      type: 'drag',
      position,
      element: updatedElement,
      timestamp: Date.now()
    };

    this.emitInteraction(interactionEvent);
  };

  /**
   * Handle mouse up events (end of drag)
   */
  private handleMouseUp = (): void => {
    this.isDragging = false;
    this.draggedElement = null;
    this.dragStartPosition = null;
  };

  /**
   * Handle mouse leave events (cancel drag if mouse leaves canvas)
   */
  private handleMouseLeave = (): void => {
    this.handleMouseUp();
  };

  /**
   * Handle touch start events
   */
  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault();
    const position = this.getTouchCoordinates(event);
    const element = this.getElementAtPosition(position);

    if (element && element.interactive) {
      this.isDragging = true;
      this.draggedElement = element;
      this.dragStartPosition = position;
    }
  };

  /**
   * Handle touch move events
   */
  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault();
    
    if (!this.isDragging || !this.draggedElement || !this.dragStartPosition) {
      return;
    }

    const position = this.getTouchCoordinates(event);
    const deltaX = position.x - this.dragStartPosition.x;
    const deltaY = position.y - this.dragStartPosition.y;

    // Update element position
    const updatedElement: CanvasElement = {
      ...this.draggedElement,
      position: {
        x: this.draggedElement.position.x + deltaX,
        y: this.draggedElement.position.y + deltaY
      }
    };

    // Update bounds if they exist
    if (updatedElement.bounds) {
      updatedElement.bounds = {
        ...updatedElement.bounds,
        x: updatedElement.bounds.x + deltaX,
        y: updatedElement.bounds.y + deltaY
      };
    }

    this.updateElement(this.draggedElement.id, updatedElement);
    this.draggedElement = updatedElement;
    this.dragStartPosition = position;

    const interactionEvent: InteractionEvent = {
      type: 'drag',
      position,
      element: updatedElement,
      timestamp: Date.now()
    };

    this.emitInteraction(interactionEvent);
  };

  /**
   * Handle touch end events
   */
  private handleTouchEnd = (): void => {
    this.isDragging = false;
    this.draggedElement = null;
    this.dragStartPosition = null;
  };

  /**
   * Add a canvas element
   */
  addElement(element: CanvasElement): void {
    this.ensureInitialized();
    
    // Set default zIndex if not provided
    const elementWithDefaults: CanvasElement = {
      ...element,
      zIndex: element.zIndex ?? 0
    };

    this.elements.set(element.id, elementWithDefaults);
  }

  /**
   * Remove a canvas element by ID
   */
  removeElement(id: string): void {
    this.ensureInitialized();
    this.elements.delete(id);
  }

  /**
   * Update a canvas element
   */
  updateElement(id: string, updates: Partial<CanvasElement>): void {
    this.ensureInitialized();
    
    const element = this.elements.get(id);
    if (!element) {
      throw new Error(`Element with id "${id}" not found`);
    }

    const updatedElement: CanvasElement = {
      ...element,
      ...updates,
      // Preserve id to prevent accidental changes
      id: element.id
    };

    this.elements.set(id, updatedElement);
  }

  /**
   * Get all canvas elements
   */
  getElements(): CanvasElement[] {
    this.ensureInitialized();
    return Array.from(this.elements.values());
  }

  /**
   * Get elements sorted by z-index (back to front)
   */
  getElementsSortedByZIndex(): CanvasElement[] {
    return this.getElements().sort((a, b) => {
      const zIndexA = a.zIndex ?? 0;
      const zIndexB = b.zIndex ?? 0;
      return zIndexA - zIndexB;
    });
  }

  /**
   * Clear all canvas elements
   */
  clearCanvas(): void {
    this.ensureInitialized();
    this.elements.clear();
  }

  /**
   * Hit detection: find element at given position
   * Returns the topmost (highest z-index) element at the position
   */
  getElementAtPosition(position: { x: number; y: number }): CanvasElement | undefined {
    const elementsAtPosition = this.getElements().filter(element =>
      this.isPointInElement(position, element)
    );

    if (elementsAtPosition.length === 0) {
      return undefined;
    }

    // Return element with highest z-index
    return elementsAtPosition.reduce((topmost, current) => {
      const topmostZ = topmost.zIndex ?? 0;
      const currentZ = current.zIndex ?? 0;
      return currentZ > topmostZ ? current : topmost;
    });
  }

  /**
   * Check if a point is inside an element's bounds
   */
  private isPointInElement(
    point: { x: number; y: number },
    element: CanvasElement
  ): boolean {
    // If element has explicit bounds, use them
    if (element.bounds) {
      const { x, y, width, height } = element.bounds;
      return (
        point.x >= x &&
        point.x <= x + width &&
        point.y >= y &&
        point.y <= y + height
      );
    }

    // Otherwise, use a default hit area around the position
    // This is a fallback for elements without explicit bounds
    const hitRadius = 20; // Default hit radius in pixels
    const dx = point.x - element.position.x;
    const dy = point.y - element.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= hitRadius;
  }

  /**
   * Subscribe to interaction events
   * Returns an unsubscribe function
   */
  onInteraction(callback: InteractionCallback): () => void {
    this.ensureInitialized();
    this.interactionCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.interactionCallbacks.delete(callback);
    };
  }

  /**
   * Emit an interaction event to all subscribers
   */
  private emitInteraction(event: InteractionEvent): void {
    this.interactionCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[CanvasController] Error in interaction callback:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.removeEventListeners();
    this.elements.clear();
    this.interactionCallbacks.clear();
    this.canvas = null;
    this.isDragging = false;
    this.draggedElement = null;
    this.dragStartPosition = null;
    this.initialized = false;
  }
}
