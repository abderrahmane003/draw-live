import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useWhiteboard } from './hooks/useWhiteboard';
import { Toolbar } from './components/Toolbar';
import { PresenceBar } from './components/PresenceBar';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { RoomSelectorModal } from './components/RoomSelectorModal';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { HomePage } from './components/HomePage';
import { Toast } from './components/Toast';
import { StrokeType, PenType } from './types';
import { generateRandomRoomId } from './lib/utils';
import { Loader2 } from 'lucide-react';

function WhiteboardRoom() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const cleanRoomId = (rawRoomId || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '') || generateRandomRoomId();

  const { userId, loading: authLoading, userName, userColor, updateProfile } = useAuth();

  const [activeTool, setActiveTool] = useState<StrokeType>('pen');
  const [activePenType, setActivePenType] = useState<PenType>('stylo');
  const [currentColor, setCurrentColor] = useState<string>('#0F172A');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time whiteboard hook
  const {
    strokes,
    activeUsers,
    addStroke,
    undoLastStroke,
    redoLastStroke,
    clearRoomCanvas,
    updatePresence,
    canUndo,
    canRedo,
    isConnected,
  } = useWhiteboard(cleanRoomId, userId, userName, userColor);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRoomSelect = (newRoomId: string) => {
    const formatted = newRoomId.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    navigate(`/room/${formatted}`);
    showToast(`Tableau #${formatted} rejoint`);
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/room/${cleanRoomId}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('Lien du tableau copié dans le presse-papier !');
    }).catch(() => {
      showToast('Lien : ' + fullUrl);
    });
  };

  // Export Canvas to PNG
  const handleDownloadPNG = () => {
    if (strokes.length === 0) {
      showToast('Le tableau est vide, dessinez d\'abord !');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.save();
      if (stroke.type === 'eraser') {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.size * 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;

        switch (stroke.penType) {
          case 'surligneur':
            ctx.lineCap = 'square';
            ctx.lineJoin = 'bevel';
            ctx.lineWidth = stroke.size * 2.2;
            ctx.globalAlpha = 0.4;
            break;
          case 'crayon':
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = Math.max(1, stroke.size * 0.9);
            ctx.globalAlpha = 0.75;
            break;
          case 'feutre':
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';
            ctx.lineWidth = stroke.size * 1.25;
            ctx.globalAlpha = 1.0;
            break;
          case 'plume':
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = stroke.size * 1.1;
            ctx.globalAlpha = 0.95;
            break;
          case 'calligraphie': {
            ctx.globalAlpha = 0.95;
            const angle = Math.PI / 4;
            const dx = (stroke.size / 2) * Math.cos(angle);
            const dy = -(stroke.size / 2) * Math.sin(angle);

            if (stroke.points.length === 1) {
              const x = stroke.points[0].x * canvas.width;
              const y = stroke.points[0].y * canvas.height;
              ctx.beginPath();
              ctx.moveTo(x - dx, y - dy);
              ctx.lineTo(x + dx, y + dy);
              ctx.lineWidth = Math.max(2, stroke.size / 2);
              ctx.stroke();
              ctx.restore();
              return;
            }

            for (let i = 0; i < stroke.points.length - 1; i++) {
              const p1x = stroke.points[i].x * canvas.width;
              const p1y = stroke.points[i].y * canvas.height;
              const p2x = stroke.points[i + 1].x * canvas.width;
              const p2y = stroke.points[i + 1].y * canvas.height;

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
            ctx.lineWidth = stroke.size * 1.5;
            ctx.globalAlpha = 1.0;
            break;
        }
      }

      if (stroke.points.length === 1) {
        const pt = stroke.points[0];
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, (ctx.lineWidth || stroke.size * 1.5) / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.type === 'eraser' ? '#FFFFFF' : stroke.color;
        ctx.fill();
        ctx.restore();
        return;
      }

      ctx.beginPath();
      let p1 = {
        x: stroke.points[0].x * canvas.width,
        y: stroke.points[0].y * canvas.height,
      };
      ctx.moveTo(p1.x, p1.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p2 = {
          x: stroke.points[i].x * canvas.width,
          y: stroke.points[i].y * canvas.height,
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
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `tableau-blanc-${cleanRoomId}.png`;
    link.href = dataUrl;
    link.click();

    showToast('Dessin téléchargé au format PNG !');
  };

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (canRedo) redoLastStroke();
        } else {
          if (canUndo) undoLastStroke();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (canRedo) redoLastStroke();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undoLastStroke, redoLastStroke]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-300">
          Connexion au tableau blanc collaboratif...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white select-none">
      {/* Top Presence & Room Header */}
      <PresenceBar
        roomId={cleanRoomId}
        activeUsers={activeUsers}
        isConnected={isConnected}
        userName={userName}
        userColor={userColor}
        onUpdateProfile={updateProfile}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
      />

      {/* Main Drawing Tools Header */}
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activePenType={activePenType}
        setActivePenType={setActivePenType}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undoLastStroke}
        onRedo={redoLastStroke}
        onClear={() => setIsClearModalOpen(true)}
        onDownload={handleDownloadPNG}
        onCopyLink={handleCopyLink}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
      />

      {/* Fullscreen Interactive Whiteboard Canvas Area */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        <WhiteboardCanvas
          strokes={strokes}
          activeTool={activeTool}
          activePenType={activePenType}
          currentColor={currentColor}
          brushSize={brushSize}
          onStrokeComplete={addStroke}
          onCursorMove={updatePresence}
          activeUsers={activeUsers}
          currentUserId={userId}
          showGrid={showGrid}
        />
      </main>

      {/* Room Selector Modal */}
      <RoomSelectorModal
        currentRoomId={cleanRoomId}
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSelectRoom={handleRoomSelect}
      />

      {/* Clear Canvas Warning Modal */}
      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          clearRoomCanvas();
          showToast('Tout le tableau a été effacé');
        }}
      />

      {/* Action Feedback Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:roomId" element={<WhiteboardRoom />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
