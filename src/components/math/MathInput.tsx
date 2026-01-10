'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'mathlive';
import { Keyboard } from 'lucide-react';

// Declare custom element for TypeScript


interface MathInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function MathInput({ value, onChange, placeholder = 'Type math here...', className = '' }: MathInputProps) {
    const mfRef = useRef<HTMLElement & { value: string; executeCommand: (cmd: any) => void }>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        // Sync external value to math-field
        if (mfRef.current && mfRef.current.value !== value) {
            mfRef.current.value = value;
        }
    }, [value]);

    useEffect(() => {
        const mf = mfRef.current;
        if (!mf) return;

        // Listen for internal changes
        const handleInput = (evt: Event) => {
            onChange((evt.target as any).value);
        };

        mf.addEventListener('input', handleInput);
        return () => mf.removeEventListener('input', handleInput);
    }, [onChange]);

    const toggleKeyboard = () => {
        if (mfRef.current) {
            // MathLive 0.98+ supports virtual keyboard toggling via commands or config
            // For simple toggle, we can focus it. MathLive manages keyboard visibility based on focus typically,
            // but we can force show/hide.
            if (isKeyboardVisible) {
                window.mathVirtualKeyboard.hide();
                setIsKeyboardVisible(false);
            } else {
                window.mathVirtualKeyboard.show();
                mfRef.current.focus();
                setIsKeyboardVisible(true);
            }
        }
    };

    return (
        <div className={`relative flex items-center border rounded-md bg-background ${className}`}>
            <math-field
                ref={mfRef}
                style={{
                    width: '100%',
                    display: 'block',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)' // ensure it uses theme color
                }}
            >
                {value}
            </math-field>

            <button
                type="button"
                onClick={toggleKeyboard}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors absolute right-2 top-1/2 -translate-y-1/2 z-10"
                title="Toggle Virtual Math Keyboard"
            >
                <Keyboard className="w-5 h-5" />
            </button>
        </div>
    );
}
