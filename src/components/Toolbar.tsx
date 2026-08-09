import React, { useState, useRef, useEffect } from 'react';
import { StrokeType, PenType } from '../types';
import {
  Pencil,
  PenTool,
  Paintbrush,
  Highlighter,
  Feather,
  Brush,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Share2,
  Check,
  Grid,
  Palette,
  ChevronDown,
  Plus,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: StrokeType;
  setActiveTool: (tool: StrokeType) => void;
  activePenType: PenType;
  setActivePenType: (penType: PenType) => void;
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

const PEN_OPTIONS = [
  {
    id: 'stylo' as PenType,
    name: 'STYLO',
    subtitle: 'Tracé fluide classique',
    icon: Pencil,
  },
  {
    id: 'crayon' as PenType,
    name: 'CRAYON',
    subtitle: 'Effet papier graphite',
    icon: PenTool,
  },
  {
    id: 'feutre' as PenType,
    name: 'FEUTRE',
    subtitle: 'Tracé net et appuyé',
    icon: Paintbrush,
  },
  {
    id: 'surligneur' as PenType,
    name: 'SURLIGNEUR',
    subtitle: 'Translucide fluo',
    icon: Highlighter,
  },
  {
    id: 'plume' as PenType,
    name: 'PLUME',
    subtitle: 'Tracé fluide biseauté',
    icon: Feather,
  },
  {
    id: 'calligraphie' as PenType,
    name: 'CALLIGRAPHIE',
    subtitle: 'Pinceau à biseau 45°',
    icon: Brush,
  },
];

const CLASSIC_COLORS = [
  '#000000', // Black
  '#1E293B', // Dark Slate
  '#64748B', // Slate
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#FFFFFF', // White
];

const SKIN_COLORS = [
  '#FFF0E5',
  '#FCD5B5',
  '#F8C39E',
  '#E0A880',
  '#C68B59',
  '#8D5B3A',
  '#583925',
  '#331C12',
];

const PRESET_SIZES = [2, 5, 10, 15, 25];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  activePenType,
  setActivePenType,
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
  const [showPenPicker, setShowPenPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem('whiteboard_saved_colors');
      return local ? JSON.parse(local) : ['#FCD5B5', '#06B6D4', '#EF4444'];
    } catch {
      return ['#FCD5B5', '#06B6D4', '#EF4444'];
    }
  });

  const penPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const sizePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        penPickerRef.current &&
        !penPickerRef.current.contains(event.target as Node)
      ) {
        setShowPenPicker(false);
      }
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
      if (
        sizePickerRef.current &&
        !sizePickerRef.current.contains(event.target as Node)
      ) {
        setShowSizePicker(false);
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

  const handleSaveCurrentColor = () => {
    if (!savedColors.includes(currentColor)) {
      const next = [...savedColors, currentColor];
      setSavedColors(next);
      localStorage.setItem('whiteboard_saved_colors', JSON.stringify(next));
    }
  };

  const currentPenOption = PEN_OPTIONS.find((p) => p.id === activePenType) || PEN_OPTIONS[0];

  return (
    <header className="sticky top-0 z-50 bg-amber-200 border-b-4 border-slate-900 px-4 sm:px-6 py-2.5 shadow-md flex items-center justify-between gap-3 font-fun select-none">
      {/* Left Group: Tools (Pen Dropdown, Eraser, Color, Size) */}
      <div className="flex items-center gap-2">
        <div className="flex bg-white border-3 border-slate-900 rounded-2xl p-1 cartoon-shadow gap-1">
          {/* Pen Selector Dropdown Button */}
          <div className="relative" ref={penPickerRef}>
            <button
              onClick={() => {
                setActiveTool('pen');
                setShowPenPicker(!showPenPicker);
                setShowColorPicker(false);
                setShowSizePicker(false);
              }}
              title="Choisir le crayon"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn border-2 ${
                activeTool === 'pen'
                  ? 'bg-emerald-500 text-slate-950 border-slate-900 shadow-xs'
                  : 'text-slate-800 border-transparent hover:bg-amber-50'
              }`}
            >
              <Pencil className="w-4 h-4 stroke-[2.5]" />
              <span className="uppercase tracking-wide font-black">
                {currentPenOption.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showPenPicker ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* CHOISIR LE CRAYON Popover */}
            {showPenPicker && (
              <div className="absolute top-full left-0 mt-3 p-4 bg-slate-900 text-white rounded-3xl cartoon-shadow-lg border-3 border-slate-900 z-50 w-72 animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  CHOISIR LE CRAYON
                </p>
                <div className="flex flex-col gap-1.5">
                  {PEN_OPTIONS.map((pen) => {
                    const Icon = pen.icon;
                    const isSelected = activePenType === pen.id;
                    return (
                      <button
                        key={pen.id}
                        onClick={() => {
                          setActivePenType(pen.id);
                          setActiveTool('pen');
                          setShowPenPicker(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all border-2 text-left ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-sm'
                            : 'bg-slate-800/40 border-transparent text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Icon className="w-5 h-5 stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="text-xs font-black tracking-wide uppercase">
                              {pen.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {pen.subtitle}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-emerald-400 stroke-[3] ml-2 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Eraser Tool */}
          <button
            onClick={() => {
              setActiveTool('eraser');
              setShowPenPicker(false);
              setShowColorPicker(false);
              setShowSizePicker(false);
            }}
            title="Gomme (Effacer des traits)"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cartoon-btn border-2 ${
              activeTool === 'eraser'
                ? 'bg-sky-400 text-slate-900 border-slate-900 shadow-xs'
                : 'text-slate-800 border-transparent hover:bg-amber-50'
            }`}
          >
            <Eraser className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline uppercase">Gomme</span>
          </button>
        </div>

        <div className="h-8 w-1 bg-slate-900 rounded-full my-auto opacity-30" />

        {/* Color Picker Swatch */}
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={() => {
              if (activeTool === 'eraser') {
                setActiveTool('pen');
              }
              setShowColorPicker(!showColorPicker);
              setShowPenPicker(false);
              setShowSizePicker(false);
            }}
            title="Choisir la couleur"
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-3 border-slate-900 bg-white text-sm font-black cartoon-shadow cartoon-btn hover:bg-amber-50`}
          >
            <span
              className="w-5 h-5 rounded-full border-2 border-slate-900 shadow-xs inline-block"
              style={{ backgroundColor: currentColor }}
            />
            <Palette className="w-4 h-4 text-slate-900 stroke-[2.5]" />
          </button>

          {/* Color Palette Popover */}
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-3 p-4 bg-slate-900 text-white rounded-3xl cartoon-shadow-lg border-3 border-slate-900 z-50 w-80 animate-in fade-in zoom-in-95 duration-100">
              {/* COULEURS CLASSIQUES */}
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                COULEURS CLASSIQUES
              </p>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {CLASSIC_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrentColor(c);
                      setActiveTool('pen');
                      setShowColorPicker(false);
                    }}
                    className={`w-9 h-9 rounded-full border-2 border-slate-700 transition-transform hover:scale-110 flex items-center justify-center relative ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-emerald-400 scale-105 border-white'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check
                        className={`w-4 h-4 stroke-[3] ${
                          c === '#FFFFFF' ? 'text-slate-900' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* COULEURS PEAU / CHAIR */}
              <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-2.5">
                COULEURS PEAU / CHAIR
              </p>
              <div className="grid grid-cols-8 gap-1.5 mb-4">
                {SKIN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrentColor(c);
                      setActiveTool('pen');
                      setShowColorPicker(false);
                    }}
                    className={`w-7 h-7 rounded-full border-2 border-slate-700 transition-transform hover:scale-110 flex items-center justify-center ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-emerald-400 scale-105 border-white'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>

              {/* MES COULEURS ENREGISTRÉES */}
              <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-2.5">
                MES COULEURS ENREGISTRÉES
              </p>
              <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                {savedColors.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentColor(c);
                      setActiveTool('pen');
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-full border-2 border-slate-700 transition-transform hover:scale-110 flex items-center justify-center ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-emerald-400 scale-105 border-white'
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

              <div className="border-t border-slate-800 my-3" />

              {/* Nuancier libre */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-200">
                  Nuancier libre
                </span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    setCurrentColor(e.target.value);
                    setActiveTool('pen');
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border-2 border-slate-700 p-0 overflow-hidden bg-transparent"
                />
              </div>

              {/* Enregistrer la couleur */}
              <button
                onClick={handleSaveCurrentColor}
                className="w-full py-2.5 rounded-2xl border-2 border-emerald-500/80 text-emerald-400 hover:bg-emerald-500/10 font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>ENREGISTRER LA COULEUR</span>
              </button>
            </div>
          )}
        </div>

        {/* Brush Size Picker Button */}
        <div className="relative" ref={sizePickerRef}>
          <button
            onClick={() => {
              setShowSizePicker(!showSizePicker);
              setShowPenPicker(false);
              setShowColorPicker(false);
            }}
            title="Taille du trait"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border-3 border-slate-900 bg-white text-xs sm:text-sm font-black cartoon-shadow cartoon-btn hover:bg-amber-50"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>{brushSize}px</span>
          </button>

          {/* TAILLE DU TRAIT Popover */}
          {showSizePicker && (
            <div className="absolute top-full left-0 mt-3 p-4 bg-slate-900 text-white rounded-3xl cartoon-shadow-lg border-3 border-slate-900 z-50 w-72 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                TAILLE DU TRAIT
              </p>

              {/* Preset Dots Array */}
              <div className="flex items-center justify-between gap-1 mb-3">
                {PRESET_SIZES.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setBrushSize(sz)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all border-2 ${
                      brushSize === sz
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800/50 border-transparent hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span
                      className="rounded-full bg-current inline-block"
                      style={{
                        width: `${Math.max(3, Math.min(18, sz))}px`,
                        height: `${Math.max(3, Math.min(18, sz))}px`,
                      }}
                    />
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 my-3" />

              {/* Slider Row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-200">
                  Épaisseur
                </span>
                <span className="text-xs font-black text-emerald-400">
                  {brushSize}px
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          )}
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
          title={
            showGrid ? 'Masquer le quadrillage' : 'Afficher le quadrillage'
          }
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
        {/* Clear Button */}
        <div className="relative">
          <button
            onClick={onClear}
            title="Effacer tout le tableau blanc"
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
          {copied ? (
            <Check className="w-4 h-4 text-yellow-300 stroke-[3]" />
          ) : (
            <Share2 className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>{copied ? 'Lien Copié !' : 'Partager 💌'}</span>
        </button>
      </div>
    </header>
  );
};
