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
  Grid,
  Palette,
  ChevronDown,
  Check,
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
  '#000000',
  '#1E293B',
  '#64748B',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#FFFFFF',
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
  showGrid,
  setShowGrid,
}) => {
  const [showPenPicker, setShowPenPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

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

  const handleSaveCurrentColor = () => {
    if (!savedColors.includes(currentColor)) {
      const next = [...savedColors, currentColor];
      setSavedColors(next);
      localStorage.setItem('whiteboard_saved_colors', JSON.stringify(next));
    }
  };

  const currentPenOption = PEN_OPTIONS.find((p) => p.id === activePenType) || PEN_OPTIONS[0];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] sm:max-w-max select-none font-fun">
      {/* Floating Kid-Friendly Cartoon Toolbar Container */}
      <div className="bg-amber-200 text-slate-900 border-3 border-slate-900 cartoon-shadow-lg rounded-2xl p-1.5 flex items-center gap-1.5 sm:gap-2">
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cartoon-btn cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-emerald-400 text-slate-950 border-2 border-slate-900 cartoon-shadow'
                : 'bg-white text-slate-900 border-2 border-slate-900 hover:bg-amber-50'
            }`}
          >
            <Pencil className="w-3.5 h-3.5 stroke-[3]" />
            <span className="uppercase tracking-wide font-black text-xs">
              {currentPenOption.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 stroke-[3] transition-transform ${
                showPenPicker ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* CHOISIR LE CRAYON Popover (Floating Up) */}
          {showPenPicker && (
            <div className="absolute bottom-full mb-3 left-0 p-3.5 bg-white text-slate-900 rounded-3xl border-3 border-slate-900 cartoon-shadow-lg z-50 w-72 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-black text-pink-600 uppercase tracking-widest mb-2.5">
                ✏️ CHOISIR TON OUTIL
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
                      className={`w-full flex items-center justify-between p-2 rounded-2xl transition-all border-2 text-left cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-100 border-slate-900 text-slate-900 font-black'
                          : 'bg-amber-50/60 border-slate-900/20 text-slate-800 hover:bg-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl border-2 border-slate-900 flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-400 text-slate-950 font-bold'
                              : 'bg-white text-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase">
                            {pen.name}
                          </p>
                          <p className="text-[10px] text-slate-600 font-bold">
                            {pen.subtitle}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3] ml-2 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Eraser Button */}
        <button
          onClick={() => {
            setActiveTool('eraser');
            setShowPenPicker(false);
            setShowColorPicker(false);
            setShowSizePicker(false);
          }}
          title="Gomme (Effacer des traits)"
          className={`p-2 rounded-xl border-2 border-slate-900 transition-all cartoon-btn cursor-pointer ${
            activeTool === 'eraser'
              ? 'bg-sky-300 text-slate-950 cartoon-shadow'
              : 'bg-white text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Eraser className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Color Picker Button */}
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-900 text-xs font-black border-2 border-slate-900 cartoon-btn cursor-pointer"
          >
            <span
              className="w-4 h-4 rounded-full border-2 border-slate-900 inline-block shrink-0 shadow-xs"
              style={{ backgroundColor: currentColor }}
            />
            <Palette className="w-3.5 h-3.5 text-slate-800 stroke-[2.5]" />
          </button>

          {/* Color Palette Popover (Floating Up) */}
          {showColorPicker && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-4 bg-white text-slate-900 rounded-3xl border-3 border-slate-900 cartoon-shadow-lg z-50 w-80 max-w-[92vw] animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-black text-pink-600 uppercase tracking-widest mb-2.5">
                🎨 COULEURS RIGOLOTES
              </p>
              <div className="grid grid-cols-6 gap-2 mb-3.5">
                {CLASSIC_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrentColor(c);
                      setActiveTool('pen');
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-full border-2 border-slate-900 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-4 ring-pink-400 scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          c === '#FFFFFF' ? 'text-slate-900' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-2">
                👶 TEINTES PEAU / CHAIR
              </p>
              <div className="grid grid-cols-8 gap-1.5 mb-3.5">
                {SKIN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrentColor(c);
                      setActiveTool('pen');
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 border-slate-900 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-pink-400 scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-2">
                ⭐ MES COULEURS FAVORITES
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
                {savedColors.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentColor(c);
                      setActiveTool('pen');
                      setShowColorPicker(false);
                    }}
                    className={`w-7 h-7 rounded-full border-2 border-slate-900 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-pink-400 scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {currentColor.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t-2 border-slate-900 my-2.5" />

              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-black text-slate-900">
                  Choisir une couleur unique
                </span>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    setCurrentColor(e.target.value);
                    setActiveTool('pen');
                  }}
                  className="w-8 h-8 rounded-xl cursor-pointer border-2 border-slate-900 p-0 overflow-hidden bg-transparent"
                />
              </div>

              <button
                onClick={handleSaveCurrentColor}
                className="w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white border-2 border-slate-900 font-black text-xs uppercase flex items-center justify-center gap-1.5 cartoon-btn transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Enregistrer ma couleur</span>
              </button>
            </div>
          )}
        </div>

        {/* Size Picker Button */}
        <div className="relative" ref={sizePickerRef}>
          <button
            onClick={() => {
              setShowSizePicker(!showSizePicker);
              setShowPenPicker(false);
              setShowColorPicker(false);
            }}
            title="Taille du trait"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-900 text-xs font-black border-2 border-slate-900 cartoon-btn cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900 inline-block" />
            <span>{brushSize}px</span>
          </button>

          {/* TAILLE DU TRAIT Popover (Floating Up) */}
          {showSizePicker && (
            <div className="absolute bottom-full mb-3 right-0 p-3.5 bg-white text-slate-900 rounded-3xl border-3 border-slate-900 cartoon-shadow-lg z-50 w-72 max-w-[90vw] animate-in fade-in zoom-in-95 duration-100">
              <p className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-2.5">
                ✏️ ÉPAISSEUR DU TRAIT
              </p>

              <div className="flex items-center justify-between gap-1 mb-3">
                {PRESET_SIZES.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setBrushSize(sz)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border-2 cursor-pointer ${
                      brushSize === sz
                        ? 'bg-emerald-300 border-slate-900 text-slate-950 cartoon-shadow font-black'
                        : 'bg-amber-50 border-slate-900/30 hover:bg-amber-100 text-slate-800'
                    }`}
                  >
                    <span
                      className="rounded-full bg-slate-900 inline-block"
                      style={{
                        width: `${Math.max(3, Math.min(16, sz))}px`,
                        height: `${Math.max(3, Math.min(16, sz))}px`,
                      }}
                    />
                  </button>
                ))}
              </div>

              <div className="border-t-2 border-slate-900 my-2.5" />

              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-slate-900">
                  Taille exacte
                </span>
                <span className="text-xs font-black text-pink-600 bg-pink-100 border border-slate-900 px-2 py-0.5 rounded-full">
                  {brushSize}px
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-3 bg-amber-100 border-2 border-slate-900 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          )}
        </div>

        {/* Grid Toggle Button */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          title={showGrid ? 'Masquer la grille' : 'Afficher la grille'}
          className={`p-2 rounded-xl border-2 border-slate-900 transition-all cartoon-btn cursor-pointer ${
            showGrid
              ? 'bg-purple-300 text-slate-950 cartoon-shadow'
              : 'bg-white text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Grid className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[2px] bg-slate-900 my-auto mx-0.5" />

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Annuler (Ctrl+Z)"
          className="p-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-50 text-slate-900 disabled:opacity-40 cartoon-btn transition-all cursor-pointer"
        >
          <Undo2 className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Refaire (Ctrl+Y)"
          className="p-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-amber-50 text-slate-900 disabled:opacity-40 cartoon-btn transition-all cursor-pointer"
        >
          <Redo2 className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
