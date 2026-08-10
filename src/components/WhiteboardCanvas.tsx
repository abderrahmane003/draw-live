import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stroke, Point, UserPresence, StrokeType, PenType } from '../types';

interface WhiteboardCanvasProps {
  strokes: Stroke[];
  activeTool: StrokeType;
  activePenType: PenType;
  currentColor: string;
  brushSize: number;
  onStrokeComplete: (stroke: Omit<Stroke, 'id' | 'timestamp'>) => void;
  onCursorMove: (
    cursor: Point | null,
    isDrawing: boolean,
    drawingDetails?: {
      points?: Point[];
      tool?: StrokeType;
      penType?: PenType;
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
  activePenType,
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
      penType: PenType | undefined,
      color: string,
      size: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      if (points.length === 0) return;

      ctx.save();

      if (type === 'eraser') {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = size * 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        switch (penType) {
          case 'surligneur':
            ctx.lineCap = 'square';
            ctx.lineJoin = 'bevel';
            ctx.lineWidth = size * 2.2;
            ctx.globalAlpha = 0.4;
            break;
          case 'crayon':
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = Math.max(1, size * 0.9);
            ctx.globalAlpha = 0.75;
            break;
          case 'feutre':
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';
            ctx.lineWidth = size * 1.25;
            ctx.globalAlpha = 1.0;
            break;
          case 'plume':
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = size * 1.1;
            ctx.globalAlpha = 0.95;
            break;
          case 'calligraphie': {
            ctx.globalAlpha = 0.95;
            const angle = Math.PI / 4; // 45 degrees
            const dx = (size / 2) * Math.cos(angle);
            const dy = -(size / 2) * Math.sin(angle);

            if (points.length === 1) {
              const x = points[0].x * canvasWidth;
              const y = points[0].y * canvasHeight;
              ctx.beginPath();
              ctx.moveTo(x - dx, y - dy);
              ctx.lineTo(x + dx, y + dy);
              ctx.lineWidth = Math.max(2, size / 2);
              ctx.stroke();
              ctx.restore();
              return;
            }

            for (let i = 0; i < points.length - 1; i++) {
              const p1x = points[i].x * canvasWidth;
              const p1y = points[i].y * canvasHeight;
              const p2x = points[i + 1].x * canvasWidth;
              const p2y = points[i + 1].y * canvasHeight;

              ctx.beginPath();
              ctx.moveTo(p1x - dx, p1y - dy);
              ctx.lineTo(p1x + dx, p1y + dy);
              ctx.lineTo(p2x + dx, p2y + dy);
              ctx.lineTo(p2x - dx, p2y - dy);
              ctx.closePath();
              ctx.fill();
            }
            ctx.restore();
            return;
          }
          case 'stylo':
          default:
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = size;
            ctx.globalAlpha = 1.0;
            break;
        }
      }

      if (points.length === 1) {
        const pt = points[0];
        const x = pt.x * canvasWidth;
        const y = pt.y * canvasHeight;
        ctx.beginPath();
        ctx.arc(x, y, (ctx.lineWidth || size) / 2, 0, Math.PI * 2);
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
        stroke.penType,
        stroke.color,
        stroke.size,
        width,
        height
      );
    });
  }, [strokes, dimensions, drawStrokeOnCtx]);

  // Redraw local and remote active preview strokes while drawing
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
        activePenType,
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
          user.drawingPenType,
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
    activePenType,
    currentColor,
    brushSize,
    activeUsers,
    currentUserId,
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
  const handleStart = useCallback((clientX: number, clientY: number) => {
    const point = getCanvasPoint(clientX, clientY);
    if (!point) return;

    const initialPoints = [point];
    setIsDrawing(true);
    setCurrentPoints(initialPoints);
    onCursorMove(point, true, {
      points: initialPoints,
      tool: activeTool,
      penType: activePenType,
      color: currentColor,
      size: brushSize,
    });
  }, [activeTool, activePenType, currentColor, brushSize, onCursorMove]);

  // Move Drawing
  const handleMove = useCallback((clientX: number, clientY: number) => {
    const point = getCanvasPoint(clientX, clientY);

    if (isDrawing && point) {
      setCurrentPoints((prev) => {
        const nextPoints = [...prev, point];
        onCursorMove(point, true, {
          points: nextPoints,
          tool: activeTool,
          penType: activePenType,
          color: currentColor,
          size: brushSize,
        });
        return nextPoints;
      });
    } else {
      onCursorMove(point, false);
    }
  }, [isDrawing, activeTool, activePenType, currentColor, brushSize, onCursorMove]);

  // End Drawing
  const handleEnd = useCallback(() => {
    if (isDrawing) {
      if (currentPoints.length > 0 && currentUserId) {
        onStrokeComplete({
          userId: currentUserId,
          type: activeTool,
          penType: activePenType,
          color: currentColor,
          size: brushSize,
          points: currentPoints,
        });
      }
      setIsDrawing(false);
      setCurrentPoints([]);
      onCursorMove(null, false);
    }
  }, [isDrawing, currentPoints, currentUserId, activeTool, activePenType, currentColor, brushSize, onStrokeComplete, onCursorMove]);

  // Store fresh handlers in refs for native non-passive listeners
  const handleStartRef = useRef(handleStart);
  handleStartRef.current = handleStart;
  const handleMoveRef = useRef(handleMove);
  handleMoveRef.current = handleMove;
  const handleEndRef = useRef(handleEnd);
  handleEndRef.current = handleEnd;

  // Attach non-passive touch event listeners directly to prevent mobile browser scrolling/bouncing while drawing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        handleStartRef.current(touch.clientX, touch.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        handleMoveRef.current(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      handleEndRef.current();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

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

  // Filter other active users (excluding current user)
  const otherUsers = activeUsers.filter(
    (u) => u.userId !== currentUserId && u.cursor !== null
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-slate-50 cursor-crosshair touch-none overscroll-none ${
        showGrid ? 'bg-grid-pattern' : ''
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
