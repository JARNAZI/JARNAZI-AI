'use client';
import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2, X } from 'lucide-react';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Timer
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Microphone access denied or not available.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setElapsed(0);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isRecording) {
        return (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-full animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-400 font-mono text-sm font-bold">{formatTime(elapsed)}</span>
                <button onClick={stopRecording} className="p-1 hover:bg-red-500/20 rounded-full text-red-500 transition-colors">
                    <Square className="w-4 h-4 fill-current" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={startRecording}
            className="flex flex-col items-center justify-center gap-1 p-2 w-16 group"
            title="Record Audio"
        >
            <div className="p-2 bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 group-hover:text-red-400 group-hover:border-red-500/50 transition-colors">
                <Mic className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 select-none">Audio</span>
        </button>
    );
}

export function AudioPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
    return (
        <div className="relative inline-flex items-center gap-2 p-2 pr-8 bg-zinc-800/80 border border-white/10 rounded-xl animate-in fade-in zoom-in duration-200">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Mic className="w-4 h-4 text-indigo-400" />
            </div>
            <audio src={url} controls className="h-8 w-48" />
            <button
                onClick={onRemove}
                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}
