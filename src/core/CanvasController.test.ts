/**
 * Tests for CanvasController
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasController } from './CanvasController';
import type { CanvasElement, InteractionEvent } from '../types/canvas';

describe('CanvasController', () => {
  let controller: CanvasController;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    controller = new CanvasController();
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
  });

  describe('Initialization', () => {
    it('should initialize with a canvas element', () => {
      expect(() => controller.initialize(canvas)).not.toThrow();
    });

    it('should throw error when operations are performed before initialization', () => {
      const element: CanvasElement = {
        id: 'test',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true
      };

      expect(() => controller.addElement(element)).toThrow(
        'CanvasController not initialized'
      );
    });

    it('should not reinitialize if already initialized', () => {
      controller.initialize(canvas);
      const firstCanvas = canvas;
      
      const newCanvas = document.createElement('canvas');
      controller.initialize(newCanvas);
      
      // Should still use the first canvas
      expect(() => controller.getElements()).not.toThrow();
    });
  });

  describe('Element Management', () => {
    beforeEach(() => {
      controller.initialize(canvas);
    });

    it('should add an element', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: { text: 'Hello' },
        interactive: true
      };

      controller.addElement(element);
      const elements = controller.getElements();

      expect(elements).toHaveLength(1);
      expect(elements[0].id).toBe('element1');
    });

    it('should add default zIndex of 0 if not provided', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true
      };

      controller.addElement(element);
      const elements = controller.getElements();

      expect(elements[0].zIndex).toBe(0);
    });

    it('should preserve provided zIndex', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        zIndex: 5
      };

      controller.addElement(element);
      const elements = controller.getElements();

      expect(elements[0].zIndex).toBe(5);
    });

    it('should remove an element by id', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true
      };

      controller.addElement(element);
      expect(controller.getElements()).toHaveLength(1);

      controller.removeElement('element1');
      expect(controller.getElements()).toHaveLength(0);
    });

    it('should update an element', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: { text: 'Hello' },
        interactive: true
      };

      controller.addElement(element);
      controller.updateElement('element1', {
        position: { x: 200, y: 200 },
        properties: { text: 'Updated' }
      });

      const elements = controller.getElements();
      expect(elements[0].position).toEqual({ x: 200, y: 200 });
      expect(elements[0].properties.text).toBe('Updated');
    });

    it('should throw error when updating non-existent element', () => {
      expect(() => {
        controller.updateElement('nonexistent', { position: { x: 0, y: 0 } });
      }).toThrow('Element with id "nonexistent" not found');
    });

    it('should preserve element id when updating', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true
      };

      controller.addElement(element);
      controller.updateElement('element1', { id: 'different-id' } as any);

      const elements = controller.getElements();
      expect(elements[0].id).toBe('element1');
    });

    it('should clear all elements', () => {
      controller.addElement({
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true
      });
      controller.addElement({
        id: 'element2',
        type: 'shape',
        position: { x: 200, y: 200 },
        properties: {},
        interactive: true
      });

      expect(controller.getElements()).toHaveLength(2);

      controller.clearCanvas();
      expect(controller.getElements()).toHaveLength(0);
    });
  });

  describe('Z-Index Sorting', () => {
    beforeEach(() => {
      controller.initialize(canvas);
    });

    it('should sort elements by z-index (back to front)', () => {
      controller.addElement({
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        zIndex: 5
      });
      controller.addElement({
        id: 'element2',
        type: 'text',
        position: { x: 200, y: 200 },
        properties: {},
        interactive: true,
        zIndex: 2
      });
      controller.addElement({
        id: 'element3',
        type: 'text',
        position: { x: 300, y: 300 },
        properties: {},
        interactive: true,
        zIndex: 10
      });

      const sorted = controller.getElementsSortedByZIndex();

      expect(sorted[0].id).toBe('element2'); // zIndex: 2
      expect(sorted[1].id).toBe('element1'); // zIndex: 5
      expect(sorted[2].id).toBe('element3'); // zIndex: 10
    });

    it('should handle elements with same z-index', () => {
      controller.addElement({
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        zIndex: 5
      });
      controller.addElement({
        id: 'element2',
        type: 'text',
        position: { x: 200, y: 200 },
        properties: {},
        interactive: true,
        zIndex: 5
      });

      const sorted = controller.getElementsSortedByZIndex();
      expect(sorted).toHaveLength(2);
      expect(sorted[0].zIndex).toBe(5);
      expect(sorted[1].zIndex).toBe(5);
    });
  });

  describe('Hit Detection', () => {
    beforeEach(() => {
      controller.initialize(canvas);
    });

    it('should detect element with explicit bounds', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        bounds: { x: 100, y: 100, width: 50, height: 50 }
      };

      controller.addElement(element);

      const found = controller.getElementAtPosition({ x: 125, y: 125 });
      expect(found?.id).toBe('element1');
    });

    it('should not detect element outside bounds', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        bounds: { x: 100, y: 100, width: 50, height: 50 }
      };

      controller.addElement(element);

      const found = controller.getElementAtPosition({ x: 200, y: 200 });
      expect(found).toBeUndefined();
    });

    it('should use default hit radius for elements without bounds', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true
      };

      controller.addElement(element);

      // Within default hit radius (20 pixels)
      const found = controller.getElementAtPosition({ x: 110, y: 110 });
      expect(found?.id).toBe('element1');

      // Outside default hit radius
      const notFound = controller.getElementAtPosition({ x: 150, y: 150 });
      expect(notFound).toBeUndefined();
    });

    it('should return topmost element when multiple elements overlap', () => {
      controller.addElement({
        id: 'bottom',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        zIndex: 1,
        bounds: { x: 100, y: 100, width: 100, height: 100 }
      });
      controller.addElement({
        id: 'middle',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        zIndex: 5,
        bounds: { x: 100, y: 100, width: 100, height: 100 }
      });
      controller.addElement({
        id: 'top',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        zIndex: 10,
        bounds: { x: 100, y: 100, width: 100, height: 100 }
      });

      const found = controller.getElementAtPosition({ x: 150, y: 150 });
      expect(found?.id).toBe('top');
    });

    it('should handle elements with undefined zIndex', () => {
      controller.addElement({
        id: 'element1',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        bounds: { x: 100, y: 100, width: 100, height: 100 }
      });
      controller.addElement({
        id: 'element2',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        zIndex: 5,
        bounds: { x: 100, y: 100, width: 100, height: 100 }
      });

      const found = controller.getElementAtPosition({ x: 150, y: 150 });
      expect(found?.id).toBe('element2'); // Higher z-index
    });
  });

  describe('Interaction Events', () => {
    beforeEach(() => {
      controller.initialize(canvas);
    });

    it('should subscribe to interaction events', () => {
      const callback = vi.fn();
      const unsubscribe = controller.onInteraction(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit click events', () => {
      const callback = vi.fn();
      controller.onInteraction(callback);

      const element: CanvasElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        bounds: { x: 100, y: 100, width: 50, height: 50 }
      };
      controller.addElement(element);

      // Simulate click
      const clickEvent = new MouseEvent('click', {
        clientX: 125,
        clientY: 125
      });
      canvas.dispatchEvent(clickEvent);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
          element: expect.objectContaining({ id: 'element1' })
        })
      );
    });

    it('should unsubscribe from interaction events', () => {
      const callback = vi.fn();
      const unsubscribe = controller.onInteraction(callback);

      unsubscribe();

      // Simulate click
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(clickEvent);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      controller.onInteraction(errorCallback);
      controller.onInteraction(normalCallback);

      // Simulate click
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 100
      });
      
      expect(() => canvas.dispatchEvent(clickEvent)).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('Drag Interactions', () => {
    beforeEach(() => {
      controller.initialize(canvas);
    });

    it('should handle drag interactions', () => {
      const callback = vi.fn();
      controller.onInteraction(callback);

      const element: CanvasElement = {
        id: 'element1',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        bounds: { x: 100, y: 100, width: 50, height: 50 }
      };
      controller.addElement(element);

      // Simulate drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 125,
        clientY: 125
      });
      canvas.dispatchEvent(mouseDown);

      const mouseMove = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150
      });
      canvas.dispatchEvent(mouseMove);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'drag'
        })
      );
    });

    it('should update element position during drag', () => {
      const element: CanvasElement = {
        id: 'element1',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        bounds: { x: 100, y: 100, width: 50, height: 50 }
      };
      controller.addElement(element);

      // Simulate drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 125,
        clientY: 125
      });
      canvas.dispatchEvent(mouseDown);

      const mouseMove = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150
      });
      canvas.dispatchEvent(mouseMove);

      const elements = controller.getElements();
      expect(elements[0].position.x).toBeGreaterThan(100);
      expect(elements[0].position.y).toBeGreaterThan(100);
    });

    it('should stop dragging on mouse up', () => {
      const callback = vi.fn();
      controller.onInteraction(callback);

      const element: CanvasElement = {
        id: 'element1',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true,
        bounds: { x: 100, y: 100, width: 50, height: 50 }
      };
      controller.addElement(element);

      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 125,
        clientY: 125
      });
      canvas.dispatchEvent(mouseDown);

      // End drag
      const mouseUp = new MouseEvent('mouseup');
      canvas.dispatchEvent(mouseUp);

      callback.mockClear();

      // Move mouse after drag ended
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 200
      });
      canvas.dispatchEvent(mouseMove);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not drag non-interactive elements', () => {
      const callback = vi.fn();
      controller.onInteraction(callback);

      const element: CanvasElement = {
        id: 'element1',
        type: 'shape',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: false, // Not interactive
        bounds: { x: 100, y: 100, width: 50, height: 50 }
      };
      controller.addElement(element);

      // Try to drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 125,
        clientY: 125
      });
      canvas.dispatchEvent(mouseDown);

      const mouseMove = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150
      });
      canvas.dispatchEvent(mouseMove);

      // Should not emit drag events
      const dragEvents = callback.mock.calls.filter(
        call => call[0].type === 'drag'
      );
      expect(dragEvents).toHaveLength(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      controller.initialize(canvas);
      
      controller.addElement({
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 100 },
        properties: {},
        interactive: true
      });

      const callback = vi.fn();
      controller.onInteraction(callback);

      controller.cleanup();

      // Should throw error after cleanup
      expect(() => controller.getElements()).toThrow();

      // Events should not be emitted
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 100
      });
      canvas.dispatchEvent(clickEvent);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
