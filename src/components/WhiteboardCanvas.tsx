import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stroke, Point, UserPresence, StrokeType } from '../types';
import { Pencil, Eraser } from 'lucide-react';

interface WhiteboardCanvasProps {
  strokes: Stroke[];
  activeTool: StrokeType;
  currentColor: string;
  brushSize: number;
  onStrokeComplete: (stroke: Omit<Stroke, 'id' | 'timestamp'>) => void;
  onCursorMove: (cursor: Point | null, isDrawing: boolean) => void;
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

  // Redraw local active preview canvas while drawing (0ms latency for active user)
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);

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
  }, [
    isDrawing,
    currentPoints,
    activeTool,
    currentColor,
    brushSize,
    dimensions,
    drawStrokeOnCtx,
  ]);

  // Point conversion helper
  const getCanvasPoint = (clientX: number, clientY: number): Point | null => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const xPixel = clientX - rect.left;
    const yPixel = clientY - rect.top;

    if (
      xPixel < 0 ||
      xPixel > rect.width ||
      yPixel < 0 ||
      yPixel > rect.height
    ) {
      return null;
    }

    return {
      x: xPixel / rect.width,
      y: yPixel / rect.height,
    };
  };

  // Start Drawing
  const handleStart = (clientX: number, clientY: number) => {
    const point = getCanvasPoint(clientX, clientY);
    if (!point) return;

    setIsDrawing(true);
    setCurrentPoints([point]);
    onCursorMove(point, true);
  };

  // Move Drawing
  const handleMove = (clientX: number, clientY: number) => {
    const point = getCanvasPoint(clientX, clientY);

    if (isDrawing && point) {
      setCurrentPoints((prev) => [...prev, point]);
    }

    onCursorMove(point, isDrawing);
  };

  // End Drawing
  const handleEnd = () => {
    if (isDrawing) {
      if (currentPoints.length > 0 && currentUserId) {
        onStrokeComplete({
          userId: currentUserId,
          type: activeTool,
          color: currentColor,
          size: brushSize,
          points: currentPoints,
        });
      }
      setIsDrawing(false);
      setCurrentPoints([]);
      onCursorMove(null, false);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    handleEnd();
    onCursorMove(null, false);
  };

  // Touch Handlers for Mobile & Tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Filter other active users (excluding current user)
  const otherUsers = activeUsers.filter(
    (u) => u.userId !== currentUserId && u.cursor !== null
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-slate-50 cursor-crosshair ${
        showGrid ? 'bg-grid-pattern' : ''
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
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
