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
  '#0F172A', // Noir Slate
  '#EF4444', // Rouge éclatant
  '#F97316', // Orange vif
  '#FACC15', // Jaune soleil
  '#84CC16', // Vert lime
  '#10B981', // Vert émeraude
  '#06B6D4', // Turquoise / Cyan
  '#38BDF8', // Bleu ciel
  '#3B82F6', // Bleu royal
  '#8B5CF6', // Violet
  '#EC4899', // Rose bonbon
  '#F43F5E', // Rose intense
  '#78350F', // Marron chocolat
  '#FFFFFF', // Blanc
  '#64748B', // Gris
];

const PRESET_SIZES = [3, 8, 14, 28];

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

  const handleToggleColorPicker = () => {
    // If Gomme is active, automatically switch to pen so drawing color works immediately
    if (activeTool === 'eraser') {
      setActiveTool('pen');
    }
    setShowColorPicker((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-40 bg-amber-300 border-b-4 border-slate-900 px-3 sm:px-6 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 font-fun text-slate-900 shrink-0">
      {/* Left Group: Tools (Pencil, Eraser, Color) */}
      <div className="flex items-center gap-2">
        <div className="flex bg-white border-3 border-slate-900 rounded-2xl p-1 gap-1 cartoon-shadow">
          {/* Pencil Tool */}
          <button
            onClick={() => setActiveTool('pen')}
            title="Crayon de couleur"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn ${
              activeTool === 'pen'
                ? 'bg-pink-500 text-white border-2 border-slate-900 shadow-xs'
                : 'text-slate-800 hover:bg-amber-100'
            }`}
          >
            <Pencil className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Crayon</span>
          </button>

          {/* Eraser Tool */}
          <button
            onClick={() => setActiveTool('eraser')}
            title="Gomme magique"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn ${
              activeTool === 'eraser'
                ? 'bg-amber-400 text-slate-900 border-2 border-slate-900 shadow-xs'
                : 'text-slate-800 hover:bg-amber-100'
            }`}
          >
            <Eraser className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Gomme 🧹</span>
          </button>
        </div>

        <div className="h-6 w-0.5 bg-slate-900 opacity-20 my-auto" />

        {/* Color Picker Swatch & Popover */}
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={handleToggleColorPicker}
            title="Choisir une couleur rigolote !"
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border-3 border-slate-900 bg-white text-slate-900 text-xs sm:text-sm font-black cartoon-shadow cartoon-btn hover:bg-amber-50"
          >
            <span
              className="w-5 h-5 rounded-full border-2 border-slate-900 shadow-xs inline-block"
              style={{ backgroundColor: currentColor }}
            />
            <Palette className="w-4 h-4 text-slate-900 stroke-[2.5]" />
          </button>

          {/* Color Palette Popover Grid */}
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-3 p-4 bg-white rounded-3xl border-4 border-slate-900 z-50 w-72 cartoon-shadow-lg text-slate-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-900">
                <p className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-pink-500" />
                  <span>Palette Magique 🎨</span>
                </p>
                <span className="text-[10px] font-extrabold bg-amber-200 border border-slate-900 px-2 py-0.5 rounded-full">
                  {PRESET_COLORS.length} couleurs
                </span>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-5 gap-2.5 mb-4">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrentColor(c);
                      setActiveTool('pen');
                      setShowColorPicker(false);
                    }}
                    className={`w-9 h-9 rounded-2xl border-3 border-slate-900 transition-transform hover:scale-110 flex items-center justify-center cartoon-shadow ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'scale-110 ring-4 ring-pink-400'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check
                        className={`w-5 h-5 drop-shadow-md stroke-[3] ${
                          c === '#FFFFFF' ? 'text-slate-900' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-900">
                  Couleur sur mesure :
                </span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    setCurrentColor(e.target.value);
                    setActiveTool('pen');
                  }}
                  className="w-9 h-9 rounded-xl cursor-pointer border-2 border-slate-900 p-0 shadow-xs bg-white overflow-hidden"
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
              title={`Taille du trait ${sz}px`}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cartoon-btn ${
                brushSize === sz
                  ? 'bg-amber-300 text-slate-900 border-2 border-slate-900 font-black shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span
                className="rounded-full bg-slate-900 inline-block"
                style={{
                  width: `${Math.max(4, Math.min(16, sz / 1.5))}px`,
                  height: `${Math.max(4, Math.min(16, sz / 1.5))}px`,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Middle Group: History Actions (Undo, Redo, Grid) */}
      <div className="flex bg-white border-3 border-slate-900 rounded-2xl p-1 gap-1 cartoon-shadow">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Annuler (Ctrl+Z)"
          className={`p-1.5 rounded-xl transition-all cartoon-btn ${
            canUndo
              ? 'hover:bg-amber-100 text-slate-900 font-extrabold'
              : 'opacity-30 cursor-not-allowed text-slate-400'
          }`}
        >
          <Undo2 className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Refaire (Ctrl+Y)"
          className={`p-1.5 rounded-xl transition-all cartoon-btn ${
            canRedo
              ? 'hover:bg-amber-100 text-slate-900 font-extrabold'
              : 'opacity-30 cursor-not-allowed text-slate-400'
          }`}
        >
          <Redo2 className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

        <div className="h-5 w-0.5 bg-slate-900 opacity-20 my-auto" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          title={showGrid ? 'Masquer le quadrillage' : 'Afficher le quadrillage'}
          className={`p-1.5 rounded-xl transition-all cartoon-btn ${
            showGrid
              ? 'bg-amber-300 text-slate-900 border-2 border-slate-900 font-black shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Grid className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Right Group: Clear, Download, Share */}
      <div className="flex items-center gap-2">
        {/* Clear Button */}
        <button
          onClick={onClear}
          title="Effacer tout le tableau blanc"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-400 hover:bg-red-300 text-slate-900 font-extrabold text-xs sm:text-sm border-3 border-slate-900 cartoon-shadow cartoon-btn"
        >
          <Trash2 className="w-4.5 h-4.5 stroke-[2.5]" />
          <span className="hidden md:inline">Effacer Tout 🗑️</span>
        </button>

        {/* Download PNG Button */}
        <button
          onClick={onDownload}
          title="Télécharger ton dessin en PNG"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-300 hover:bg-emerald-200 text-slate-900 font-extrabold text-xs sm:text-sm border-3 border-slate-900 cartoon-shadow cartoon-btn"
        >
          <Download className="w-4.5 h-4.5 stroke-[2.5]" />
          <span className="hidden md:inline">Télécharger 🖼️</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleCopy}
          title="Copier le lien pour inviter des copains"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-xs sm:text-sm border-3 border-slate-900 cartoon-shadow cartoon-btn"
        >
          {copied ? (
            <Check className="w-4.5 h-4.5 stroke-[3]" />
          ) : (
            <Share2 className="w-4.5 h-4.5 stroke-[2.5]" />
          )}
          <span>{copied ? 'Lien Copié !' : 'Partager 💌'}</span>
        </button>
      </div>
    </header>
  );
};
