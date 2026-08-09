export type PenType =
  | 'stylo'
  | 'crayon'
  | 'feutre'
  | 'surligneur'
  | 'plume'
  | 'calligraphie';

export type StrokeType = 'pen' | 'eraser';

export interface Point {
  x: number; // Normalized coordinate 0..1
  y: number; // Normalized coordinate 0..1
}

export interface Stroke {
  id: string;
  userId: string;
  userName?: string;
  type: StrokeType;
  penType?: PenType;
  color: string;
  size: number; // Normalized size or pixel width (e.g., 2 to 50)
  points: Point[];
  timestamp: number;
  deleted?: boolean;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userColor: string;
  cursor: Point | null; // Normalized coordinate 0..1 or null if off canvas
  isDrawing: boolean;
  drawingPoints?: Point[];
  drawingTool?: StrokeType;
  drawingPenType?: PenType;
  drawingColor?: string;
  drawingSize?: number;
  lastSeen: number;
}

export interface RoomInfo {
  id: string;
  createdAt: number;
  lastModified: number;
  clearTimestamp?: number;
  name?: string;
}

export interface DrawingTool {
  type: StrokeType;
  penType?: PenType;
  color: string;
  size: number;
}
