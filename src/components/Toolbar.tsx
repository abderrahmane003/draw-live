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
    <header className="sticky top-0 z-40 toolbar-blur border-b border-slate-200/80 px-4 sm:px-6 py-2 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
      {/* Left Group: Tools (Pencil, Eraser, Color) */}
      <div className="flex items-center gap-2">
        <div className="flex bg-white/90 border border-slate-200 rounded-2xl p-1 shadow-xs gap-1">
          {/* Pencil Tool */}
          <button
            onClick={() => setActiveTool('pen')}
            title="Crayon (Dessin)"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeTool === 'pen'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Crayon</span>
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => setActiveTool('eraser')}
            title="Gomme (Effacer des traits)"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeTool === 'eraser'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Gomme</span>
          </button>
        </div>

        <div className="h-7 w-px bg-slate-200 my-auto" />

        {/* Color Picker Swatch */}
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={activeTool === 'eraser'}
            title="Choisir la couleur"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border bg-white text-sm font-medium transition-all shadow-xs ${
              activeTool === 'eraser'
                ? 'opacity-40 cursor-not-allowed border-slate-200'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span
              className="w-5 h-5 rounded-full border-2 border-white ring-2 ring-slate-900/10 shadow-xs inline-block"
              style={{ backgroundColor: currentColor }}
            />
            <Palette className="w-4 h-4 text-slate-500 hidden sm:inline" />
          </button>

          {/* Color Palette Popover */}
          {showColorPicker && activeTool !== 'eraser' && (
            <div className="absolute top-full left-0 mt-2 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 z-50 w-60 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Palette de couleurs
              </p>

              {/* Presets Grid */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrentColor(c);
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-full border-2 border-white transition-transform hover:scale-110 flex items-center justify-center shadow-xs ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-blue-600 ring-offset-2 scale-105'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow-xs" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-semibold">Couleur libre</span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="w-8 h-8 rounded-xl cursor-pointer border border-slate-200 p-0 overflow-hidden shadow-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brush Size Picker */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
          {PRESET_SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => setBrushSize(sz)}
              title={`Taille ${sz}px`}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                brushSize === sz
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span
                className="rounded-full bg-current inline-block"
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
      <div className="flex bg-white/90 border border-slate-200 rounded-2xl p-1 shadow-xs gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Annuler (Ctrl+Z)"
          className={`p-2 rounded-xl text-slate-600 transition-all ${
            canUndo
              ? 'hover:bg-slate-100 text-slate-800'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Refaire (Ctrl+Y)"
          className={`p-2 rounded-xl text-slate-600 transition-all ${
            canRedo
              ? 'hover:bg-slate-100 text-slate-800'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 my-auto" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          title={showGrid ? 'Masquer la grille' : 'Afficher la grille'}
          className={`p-2 rounded-xl transition-all ${
            showGrid
              ? 'bg-blue-50 text-blue-600 font-bold'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* Right Group: Clear, Download, Share */}
      <div className="flex items-center gap-2">
        {/* Clear Button */}
        <div className="relative">
          <button
            onClick={() => setShowClearConfirm(true)}
            title="Effacer tout le tableau"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium text-xs sm:text-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Effacer</span>
          </button>

          {showClearConfirm && (
            <div className="absolute right-0 top-full mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-red-100 z-50 w-64 animate-in fade-in zoom-in-95">
              <p className="text-xs font-bold text-slate-800 mb-1">
                Effacer tout le tableau ?
              </p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Cette action effacera tous les dessins pour tous les participants.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onClear();
                    setShowClearConfirm(false);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md shadow-red-200"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Download PNG Button */}
        <button
          onClick={onDownload}
          title="Télécharger en PNG"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-all shadow-xs"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span className="hidden md:inline">PNG</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleCopy}
          title="Copier le lien"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-slate-300 active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Copié !' : 'Partager'}</span>
        </button>
      </div>
    </header>
  );
};
