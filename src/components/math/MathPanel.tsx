"use client";

import React, { useEffect, useRef } from "react";
import "mathlive";
import type { MathfieldElement } from "mathlive";



type Props = {
    open: boolean;
    value: string;
    onChange: (latex: string) => void;
    onClose: () => void;
    dict?: any;
};

export default function MathPanel({ open, value, onChange, onClose, dict }: Props) {
    const mfRef = useRef<MathfieldElement | null>(null);

    useEffect(() => {
        if (!open) {
            window.mathVirtualKeyboard?.hide?.();
            return;
        }
        setTimeout(() => window.mathVirtualKeyboard?.show?.(), 0);
    }, [open]);

    useEffect(() => {
        const el = mfRef.current;
        if (!el) return;

        (el as any).menuItems = [];
        (el as any).virtualKeyboardMode = "manual";
        (el as any).showMenuToggle = false;
        (el as any).showVirtualKeyboardToggle = false;

        const handler = () => onChange(el.value || "");
        el.addEventListener("input", handler);
        return () => el.removeEventListener("input", handler);
    }, [onChange]);

    useEffect(() => {
        if (mfRef.current && mfRef.current.value !== value) {
            mfRef.current.value = value || "";
        }
    }, [value]);

    if (!open) return null;

    return (
        <div className="mt-2 rounded-xl border p-3 bg-background text-foreground animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex justify-between mb-2">
                <span className="text-sm font-bold opacity-70">{dict?.mathInput || "Math Input"}</span>
                <button onClick={onClose} className="text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80">{dict?.close || "Close"}</button>
            </div>

            <math-field
                ref={(el) => (mfRef.current = el as any)}
                className="w-full min-h-[48px] p-2 rounded border bg-background text-foreground"
            />

            <div className="flex gap-2 mt-3 flex-wrap">
                <button className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20" onClick={() => (mfRef.current as any)?.executeCommand("insertMatrix")}>
                    {dict?.insertMatrix || "Insert Matrix"}
                </button>
                <button className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80" onClick={() => (mfRef.current as any)?.executeCommand("switchMode")}>
                    {dict?.keyboardMode || "Mode"}
                </button>
                <button className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80" onClick={() => window.mathVirtualKeyboard?.show?.()}>
                    {dict?.showKeyboard || "Show Keyboard"}
                </button>
                <button className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80" onClick={() => window.mathVirtualKeyboard?.hide?.()}>
                    {dict?.hideKeyboard || "Hide Keyboard"}
                </button>
            </div>
        </div>
    );
}
