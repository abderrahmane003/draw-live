import React, { useState, useRef, useEffect } from 'react';
import { StrokeType } from '../types';
import {
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Share2,
  Check,
  Grid,
  Palette,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: StrokeType;
  setActiveTool: (tool: StrokeType) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

const PRESET_COLORS = [
  '#0F172A', // Slate Dark
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Gray
];

const PRESET_SIZES = [2, 6, 12, 24];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  currentColor,
  setCurrentColor,
  brushSize,
  setBrushSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  onCopyLink,
  showGrid,
  setShowGrid,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorButtonClick = () => {
    if (activeTool === 'eraser') {
      setActiveTool('pen');
    }
    setShowColorPicker((prev) => !prev);
  };

  const handleSelectColor = (color: string) => {
    setCurrentColor(color);
    if (activeTool === 'eraser') {
      setActiveTool('pen');
    }
    setShowColorPicker(false);
  };

  const handleCopy = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-amber-200 border-b-3 sm:border-b-4 border-slate-900 px-2 sm:px-6 py-1.5 sm:py-2.5 shadow-md font-fun">
      {/* Single Horizontal Row for all tools */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar whitespace-nowrap pb-1 sm:pb-0">
        {/* Left Group: Drawing Tools (Pencil, Eraser, Color, Size) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="flex bg-white border-2 sm:border-3 border-slate-900 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 cartoon-shadow gap-0.5 sm:gap-1">
            {/* Pencil Tool */}
            <button
              onClick={() => setActiveTool('pen')}
              title="Crayon (Dessin)"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn border sm:border-2 ${
                activeTool === 'pen'
                  ? 'bg-pink-500 text-white border-slate-900 shadow-xs'
                  : 'text-slate-800 border-transparent hover:bg-amber-50'
              }`}
            >
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden md:inline">Crayon ✏️</span>
            </button>

            {/* Eraser Tool */}
            <button
              onClick={() => setActiveTool('eraser')}
              title="Gomme (Effacer)"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn border sm:border-2 ${
                activeTool === 'eraser'
                  ? 'bg-sky-400 text-slate-900 border-slate-900 shadow-xs'
                  : 'text-slate-800 border-transparent hover:bg-amber-50'
              }`}
            >
              <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden md:inline">Gomme 🧹</span>
            </button>
          </div>

          {/* Color Picker Swatch */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              onClick={handleColorButtonClick}
              title="Choisir la couleur de dessin"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-slate-900 bg-white text-xs sm:text-sm font-black cartoon-shadow cartoon-btn hover:bg-pink-50 cursor-pointer"
            >
              <span
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-slate-900 shadow-xs inline-block shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900 stroke-[2.5]" />
            </button>

            {/* Color Palette Popover */}
            {showColorPicker && (
              <>
                {/* Backdrop on mobile/desktop to capture outside clicks */}
                <div
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setShowColorPicker(false)}
                />
                <div
                  className="absolute top-full left-0 mt-2 w-64 sm:w-72 p-3 sm:p-4 bg-white rounded-3xl cartoon-shadow-lg border-3 border-slate-900 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Couleurs Magiques 🎨
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(false)}
                      className="text-xs font-black text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg border border-slate-300 bg-slate-100"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Presets Grid */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSelectColor(c)}
                        className={`w-9 h-9 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl border-2 border-slate-900 transition-transform hover:scale-110 flex items-center justify-center shadow-xs cursor-pointer ${
                          currentColor.toLowerCase() === c.toLowerCase()
                            ? 'ring-4 ring-pink-400 scale-105'
                            : ''
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {currentColor.toLowerCase() === c.toLowerCase() && (
                          <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="pt-2.5 border-t-2 border-slate-900 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-900 font-extrabold">Couleur personnalisée</span>
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => {
                        handleSelectColor(e.target.value);
                      }}
                      className="w-9 h-9 rounded-xl cursor-pointer border-2 border-slate-900 p-0 overflow-hidden shadow-xs"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Brush Size Picker */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white border-2 sm:border-3 border-slate-900 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl cartoon-shadow">
            {PRESET_SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => setBrushSize(sz)}
                title={`Taille ${sz}px`}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cartoon-btn font-extrabold ${
                  brushSize === sz
                    ? 'bg-yellow-400 text-slate-900 border sm:border-2 border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:bg-amber-50'
                }`}
              >
                <span
                  className="rounded-full bg-slate-900 inline-block"
                  style={{
                    width: `${Math.max(4, Math.min(14, sz))}px`,
                    height: `${Math.max(4, Math.min(14, sz))}px`,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Middle Group: History Actions (Undo, Redo, Grid) */}
        <div className="flex bg-white border-2 sm:border-3 border-slate-900 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 cartoon-shadow gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-900 transition-all cartoon-btn ${
              canUndo
                ? 'hover:bg-amber-100 font-bold'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Refaire (Ctrl+Y)"
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-900 transition-all cartoon-btn ${
              canRedo
                ? 'hover:bg-amber-100 font-bold'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>

          <div className="h-5 sm:h-6 w-0.5 bg-slate-900 my-auto opacity-30" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            title={showGrid ? 'Masquer le quadrillage' : 'Afficher le quadrillage'}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all cartoon-btn ${
              showGrid
                ? 'bg-yellow-300 text-slate-900 border sm:border-2 border-slate-900 font-black'
                : 'text-slate-700 hover:bg-amber-100'
            }`}
          >
            <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Group: Clear, Download, Share */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Clear Button */}
          <button
            onClick={onClear}
            title="Effacer tout le tableau"
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-xs sm:text-sm border-2 sm:border-3 border-slate-900 cartoon-shadow cartoon-btn"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden lg:inline">Effacer Tout</span>
          </button>

          {/* Download PNG Button */}
          <button
            onClick={onDownload}
            title="Télécharger en PNG"
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-slate-900 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-xs sm:text-sm cartoon-shadow cartoon-btn"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden lg:inline">PNG</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleCopy}
            title="Copier le lien du tableau"
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs sm:text-sm border-2 sm:border-3 border-slate-900 cartoon-shadow cartoon-btn"
          >
            {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />}
            <span className="hidden sm:inline">{copied ? 'Lien Copié !' : 'Partager 💌'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
