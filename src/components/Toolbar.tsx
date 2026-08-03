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

  const handleCopy = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-amber-200 border-b-4 border-slate-900 px-4 sm:px-6 py-2.5 shadow-md flex items-center justify-between gap-3 overflow-x-auto font-fun">
      {/* Left Group: Tools (Pencil, Eraser, Color) */}
      <div className="flex items-center gap-2">
        <div className="flex bg-white border-3 border-slate-900 rounded-2xl p-1 cartoon-shadow gap-1">
          {/* Pencil Tool */}
          <button
            onClick={() => setActiveTool('pen')}
            title="Crayon (Dessin)"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn border-2 ${
              activeTool === 'pen'
                ? 'bg-pink-500 text-white border-slate-900 shadow-xs'
                : 'text-slate-800 border-transparent hover:bg-amber-50'
            }`}
          >
            <Pencil className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Crayon ✏️</span>
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => setActiveTool('eraser')}
            title="Gomme (Effacer des traits)"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn border-2 ${
              activeTool === 'eraser'
                ? 'bg-sky-400 text-slate-900 border-slate-900 shadow-xs'
                : 'text-slate-800 border-transparent hover:bg-amber-50'
            }`}
          >
            <Eraser className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Gomme 🧹</span>
          </button>
        </div>

        <div className="h-8 w-1 bg-slate-900 rounded-full my-auto opacity-30" />

        {/* Color Picker Swatch */}
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={activeTool === 'eraser'}
            title="Choisir la couleur"
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-3 border-slate-900 bg-white text-sm font-black cartoon-shadow cartoon-btn ${
              activeTool === 'eraser'
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-pink-50'
            }`}
          >
            <span
              className="w-5 h-5 rounded-full border-2 border-slate-900 shadow-xs inline-block"
              style={{ backgroundColor: currentColor }}
            />
            <Palette className="w-4 h-4 text-slate-900 hidden sm:inline stroke-[2.5]" />
          </button>

          {/* Color Palette Popover */}
          {showColorPicker && activeTool !== 'eraser' && (
            <div className="absolute top-full left-0 mt-3 p-4 bg-white rounded-3xl cartoon-shadow-lg border-3 border-slate-900 z-50 w-64 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                Couleurs Magiques 🎨
              </p>

              {/* Presets Grid */}
              <div className="grid grid-cols-5 gap-2.5 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrentColor(c);
                      setShowColorPicker(false);
                    }}
                    className={`w-9 h-9 rounded-2xl border-2 border-slate-900 transition-transform hover:scale-110 flex items-center justify-center shadow-xs ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-4 ring-pink-400 scale-105'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-5 h-5 text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-900 font-extrabold">Couleur personnalisée</span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="w-9 h-9 rounded-2xl cursor-pointer border-2 border-slate-900 p-0 overflow-hidden shadow-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brush Size Picker */}
        <div className="flex items-center gap-1 bg-white border-3 border-slate-900 p-1 rounded-2xl cartoon-shadow">
          {PRESET_SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => setBrushSize(sz)}
              title={`Taille ${sz}px`}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cartoon-btn font-extrabold ${
                brushSize === sz
                  ? 'bg-yellow-400 text-slate-900 border-2 border-slate-900 shadow-xs'
                  : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              <span
                className="rounded-full bg-slate-900 inline-block"
                style={{
                  width: `${Math.max(5, Math.min(16, sz))}px`,
                  height: `${Math.max(5, Math.min(16, sz))}px`,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Middle Group: History Actions (Undo, Redo, Grid) */}
      <div className="flex bg-white border-3 border-slate-900 rounded-2xl p-1 cartoon-shadow gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Annuler (Ctrl+Z)"
          className={`p-2 rounded-xl text-slate-900 transition-all cartoon-btn ${
            canUndo
              ? 'hover:bg-amber-100 font-bold'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Refaire (Ctrl+Y)"
          className={`p-2 rounded-xl text-slate-900 transition-all cartoon-btn ${
            canRedo
              ? 'hover:bg-amber-100 font-bold'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="h-6 w-0.5 bg-slate-900 my-auto opacity-30" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          title={showGrid ? 'Masquer le quadrillage' : 'Afficher le quadrillage'}
          className={`p-2 rounded-xl transition-all cartoon-btn ${
            showGrid
              ? 'bg-yellow-300 text-slate-900 border-2 border-slate-900 font-black'
              : 'text-slate-700 hover:bg-amber-100'
          }`}
        >
          <Grid className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Right Group: Clear, Download, Share */}
      <div className="flex items-center gap-2">
        {/* Clear Button with Warning Popup */}
        <div className="relative">
          <button
            onClick={onClear}
            title="Effacer tout le tableau blanc (Avertissement)"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-xs sm:text-sm border-3 border-slate-900 cartoon-shadow cartoon-btn"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden md:inline">Effacer Tout</span>
          </button>
        </div>

        {/* Download PNG Button */}
        <button
          onClick={onDownload}
          title="Télécharger ton dessin en PNG"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border-3 border-slate-900 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black text-xs sm:text-sm cartoon-shadow cartoon-btn"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden md:inline">Image PNG</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleCopy}
          title="Copier le lien pour inviter des amis"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs sm:text-sm border-3 border-slate-900 cartoon-shadow cartoon-btn"
        >
          {copied ? <Check className="w-4 h-4 text-yellow-300 stroke-[3]" /> : <Share2 className="w-4 h-4 stroke-[2.5]" />}
          <span>{copied ? 'Lien Copié !' : 'Partager 💌'}</span>
        </button>
      </div>
    </header>
  );
};
