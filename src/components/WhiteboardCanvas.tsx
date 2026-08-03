import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stroke, Point, UserPresence, StrokeType } from '../types';
import { Pencil, Eraser } from 'lucide-react';

interface WhiteboardCanvasProps {
  strokes: Stroke[];
  activeTool: StrokeType;
  currentColor: string;
  brushSize: number;
  onStrokeComplete: (stroke: Omit<Stroke, 'id' | 'timestamp'>) => void;
  onCursorMove: (
    cursor: Point | null,
    isDrawing: boolean,
    drawingDetails?: {
      points?: Point[];
      tool?: StrokeType;
      color?: string;
      size?: number;
    }
  ) => void;
  activeUsers: UserPresence[];
  currentUserId: string | undefined;
  showGrid?: boolean;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  strokes,
  activeTool,
  currentColor,
  brushSize,
  onStrokeComplete,
  onCursorMove,
  activeUsers,
  currentUserId,
  showGrid = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Handle ResizeObserver & High DPI
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Update Canvas internal resolution for crisp high-DPI rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    previewCanvas.width = width * dpr;
    previewCanvas.height = height * dpr;
    previewCanvas.style.width = `${width}px`;
    previewCanvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');

    if (ctx) ctx.scale(dpr, dpr);
    if (previewCtx) previewCtx.scale(dpr, dpr);
  }, [dimensions]);

  // Helper function to draw a single stroke on a canvas context
  const drawStrokeOnCtx = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: Point[],
      type: StrokeType,
      color: string,
      size: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      if (points.length === 0) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size;

      if (type === 'eraser') {
        ctx.strokeStyle = '#FFFFFF'; // Clean white eraser on white background
      } else {
        ctx.strokeStyle = color;
      }

      if (points.length === 1) {
        const pt = points[0];
        const x = pt.x * canvasWidth;
        const y = pt.y * canvasHeight;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = type === 'eraser' ? '#FFFFFF' : color;
        ctx.fill();
        ctx.restore();
        return;
      }

      ctx.beginPath();
      const firstPt = points[0];
      let p1 = {
        x: firstPt.x * canvasWidth,
        y: firstPt.y * canvasHeight,
      };

      ctx.moveTo(p1.x, p1.y);

      // Smooth curve using quadratic interpolation
      for (let i = 1; i < points.length; i++) {
        const pt = points[i];
        const p2 = {
          x: pt.x * canvasWidth,
          y: pt.y * canvasHeight,
        };

        const midPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };

        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = p2;
      }

      // Draw line to final point
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  // Redraw Main Canvas when strokes or dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background if grid is disabled or background color
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw all completed Firestore strokes
    strokes.forEach((stroke) => {
      drawStrokeOnCtx(
        ctx,
        stroke.points,
        stroke.type,
        stroke.color,
        stroke.size,
        width,
        height
      );
    });
  }, [strokes, dimensions, drawStrokeOnCtx]);

  // Redraw local and remote active preview strokes while drawing (0ms latency for all users)
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw local active stroke in progress
    if (isDrawing && currentPoints.length > 0) {
      drawStrokeOnCtx(
        ctx,
        currentPoints,
        activeTool,
        currentColor,
        brushSize,
        width,
        height
      );
    }

    // 2. Draw remote active strokes in progress from other active users
    activeUsers.forEach((user) => {
      if (
        user.userId !== currentUserId &&
        user.isDrawing &&
        user.drawingPoints &&
        user.drawingPoints.length > 0
      ) {
        drawStrokeOnCtx(
          ctx,
          user.drawingPoints,
          user.drawingTool || 'pen',
          user.drawingColor || user.userColor,
          user.drawingSize || 6,
          width,
          height
        );
      }
    });
  }, [
    isDrawing,
    currentPoints,
    activeTool,
    currentColor,
    brushSize,
    activeUsers,
    currentUserId,
    dimensions,
    drawStrokeOnCtx,
  ]);

  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<Point[]>([]);

  // Point conversion helper with clamping for edge movement on mobile screens
  const getCanvasPoint = (clientX: number, clientY: number): Point | null => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const xPixel = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const yPixel = Math.max(0, Math.min(rect.height, clientY - rect.top));

    return {
      x: xPixel / rect.width,
      y: yPixel / rect.height,
    };
  };

  // Pointer Down Handler (Mouse, Touch, Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    if (e.button !== undefined && e.button !== 0) return; // Only left click / primary touch

    const point = getCanvasPoint(e.clientX, e.clientY);
    if (!point) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_err) {
      // Fallback for browsers without setPointerCapture
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [point];
    setIsDrawing(true);
    setCurrentPoints([point]);

    onCursorMove(point, true, {
      points: [point],
      tool: activeTool,
      color: currentColor,
      size: brushSize,
    });
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    const point = getCanvasPoint(e.clientX, e.clientY);

    if (isDrawingRef.current && point) {
      currentPointsRef.current.push(point);
      const updatedPoints = [...currentPointsRef.current];
      setCurrentPoints(updatedPoints);

      onCursorMove(point, true, {
        points: updatedPoints,
        tool: activeTool,
        color: currentColor,
        size: brushSize,
      });
    } else if (point) {
      onCursorMove(point, false);
    }
  };

  // Pointer Up & Cancel Handler
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_err) {
      // Ignore capture release errors
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      const finalPoints = [...currentPointsRef.current];
      currentPointsRef.current = [];

      setIsDrawing(false);
      setCurrentPoints([]);

      if (finalPoints.length > 0 && currentUserId) {
        onStrokeComplete({
          userId: currentUserId,
          type: activeTool,
          color: currentColor,
          size: brushSize,
          points: finalPoints,
        });
      }
      onCursorMove(null, false);
    }
  };

  // Prevent default scroll on touch
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
    }
  };

  // Filter other active users (excluding current user)
  const otherUsers = activeUsers.filter(
    (u) => u.userId !== currentUserId && u.cursor !== null
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-slate-50 cursor-crosshair touch-none ${
        showGrid ? 'bg-grid-pattern' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={(e) => {
        // Only trigger pointer up on leave if pointer capture wasn't active
        if (isDrawingRef.current && !e.currentTarget.hasPointerCapture(e.pointerId)) {
          handlePointerUp(e);
        }
      }}
      onTouchMove={handleTouchMove}
    >
      {/* Background Main Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Active Local Preview Canvas */}
      <canvas
        ref={previewCanvasRef}
        className="absolute inset-0 pointer-events-none z-20"
      />

      {/* Live Collaborative Cursors Layer */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {otherUsers.map((user) => {
          if (!user.cursor) return null;

          const posX = user.cursor.x * dimensions.width;
          const posY = user.cursor.y * dimensions.height;

          return (
            <div
              key={user.userId}
              className="absolute transition-all duration-75 ease-out flex items-center gap-1.5 transform -translate-x-1 -translate-y-1"
              style={{
                left: `${posX}px`,
                top: `${posY}px`,
              }}
            >
              {/* Pointer Icon with User Color */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={user.userColor}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="drop-shadow-md"
              >
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>

              {/* User Label Badge */}
              <div
                className="px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-md flex items-center gap-1 whitespace-nowrap"
                style={{ backgroundColor: user.userColor }}
              >
                <span>{user.userName}</span>
                {user.isDrawing && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
