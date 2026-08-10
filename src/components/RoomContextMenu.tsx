import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Share2, Trash2 } from 'lucide-react';

interface RoomContextMenuProps {
  roomId: string;
  onShare: (roomId: string) => void;
  onDelete: (roomId: string) => void;
}

export const RoomContextMenu: React.FC<RoomContextMenuProps> = ({
  roomId,
  onShare,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-xl bg-white hover:bg-amber-100 border-2 border-slate-900 text-slate-900 font-black text-sm cartoon-btn cursor-pointer transition-all"
        title="Menu de la room"
      >
        <MoreVertical className="w-4 h-4 stroke-[3]" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl border-3 border-slate-900 cartoon-shadow-lg z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 text-slate-900 font-fun"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onShare(roomId);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black hover:bg-amber-100 text-slate-900 text-left transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-sky-600 stroke-[2.5]" />
            <span>🔗 Partager</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onDelete(roomId);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black hover:bg-rose-100 text-rose-700 text-left transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600 stroke-[2.5]" />
            <span>🗑️ Supprimer</span>
          </button>
        </div>
      )}
    </div>
  );
};
