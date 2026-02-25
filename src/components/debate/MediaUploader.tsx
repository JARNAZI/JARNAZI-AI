'use client';

import type { ElementType } from 'react';
import { useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, FileText, Video as VideoIcon } from 'lucide-react';

interface MediaUploaderProps {
    onFileSelected: (file: File) => void;
    accept: string;
    label: string;
    icon?: ElementType;
}

export function MediaUploader({ onFileSelected, accept, label, icon: Icon = Upload }: MediaUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(file);
        }
    };

    return (
        <div className="relative group flex flex-col items-center justify-center gap-1 p-2 w-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="p-2 bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 shadow-lg group-hover:shadow-emerald-500/50 transition-all">
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 select-none">{label}</span>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}

export function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    const previewUrl = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <div className="relative inline-flex items-center gap-3 p-2 pr-8 bg-zinc-800/80 border border-white/10 rounded-xl animate-in fade-in zoom-in duration-200">
            {isImage ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                    ) : null}
                </div>
            ) : isVideo ? (
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center border border-white/10">
                    <VideoIcon className="w-5 h-5 text-zinc-400" />
                </div>
            ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center border border-white/10">
                    <FileText className="w-5 h-5 text-zinc-400" />
                </div>
            )}

            <div className="flex flex-col">
                <span className="text-xs font-bold text-white max-w-[120px] truncate">{file.name}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">{(file.size / 1024).toFixed(1)} KB</span>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}
