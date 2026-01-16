'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'mathlive';
import { Keyboard } from 'lucide-react';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

type MathFieldElement = HTMLElement & { value: string; focus: () => void };

type MathVirtualKeyboard = {
  show: () => void;
  hide: () => void;
};

function getMathVirtualKeyboard(): MathVirtualKeyboard | undefined {
  const w = window as any;
  return w.mathVirtualKeyboard;
}

export function MathInput({
  value,
  onChange,
  placeholder = 'Type math here...',
  className = '',
}: MathInputProps) {
  const mfRef = useRef<MathFieldElement | null>(null);
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
      const target = evt.target as any;
      onChange(target.value ?? '');
    };

    mf.addEventListener('input', handleInput);
    return () => mf.removeEventListener('input', handleInput);
  }, [onChange]);

  const toggleKeyboard = () => {
    const mf = mfRef.current;
    if (!mf) return;

    const vk = getMathVirtualKeyboard();
    if (!vk) {
      // If MathLive virtual keyboard isn't available, focusing still helps on mobile.
      mf.focus();
      return;
    }

    if (isKeyboardVisible) {
      vk.hide();
      setIsKeyboardVisible(false);
    } else {
      vk.show();
      mf.focus();
      setIsKeyboardVisible(true);
    }
  };

  return (
    <div className={`relative flex items-center border rounded-md bg-background ${className}`}>
      <math-field
        ref={mfRef}
        aria-label={placeholder}
        style={{
          width: '100%',
          display: 'block',
          padding: '8px',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          color: 'var(--foreground)',
        }}
      />
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
