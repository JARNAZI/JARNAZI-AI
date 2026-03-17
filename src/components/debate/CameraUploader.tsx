'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

export function CameraUploader({
  onFileSelected,
  label = 'Camera',
  photoLabel = 'Photo',
  videoLabel = 'Video',
}: {
  onFileSelected: (file: File) => void;
  label?: string;
  photoLabel?: string;
  videoLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative group flex flex-col items-center justify-center gap-1 p-2 w-16" ref={containerRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/50 transition-all"
      >
        <Camera className="w-5 h-5 cursor-pointer" />
      </button>
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 select-none cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{label}</span>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 z-[100]">
          <button 
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="font-semibold">{photoLabel}</span>
          </button>
          <div className="h-px bg-zinc-700 w-full" />
          <button 
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-emerald-400 transition-colors"
          >
            <VideoIcon className="w-4 h-4" />
            <span className="font-semibold">{videoLabel}</span>
          </button>
        </div>
      )}

      {/* Hidden native inputs mapped for Web APIs and Capacitor interception */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
