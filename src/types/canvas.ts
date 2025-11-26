/**
 * Canvas and interaction related type definitions
 */

export interface InteractionEvent {
  type: 'click' | 'drag' | 'pinch' | 'hover';
  position: { x: number; y: number };
  element?: CanvasElement;
  timestamp: number;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'particle';
  position: { x: number; y: number };
  properties: Record<string, any>;
  interactive: boolean;
  zIndex?: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface InteractionData {
  clickPosition: { x: number; y: number };
  dragPath: { x: number; y: number }[];
  timestamp: number;
}
