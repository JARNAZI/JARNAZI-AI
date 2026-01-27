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

type MathFieldElement = HTMLElement & {
  value: string;
  focus: () => void;
  menuItems: any[];
  virtualKeyboardMode: string;
  showMenuToggle: boolean;
  showVirtualKeyboardToggle: boolean;
};

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
  clean,
}: MathInputProps & { clean?: boolean }) {
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

    if (clean) {
      mf.menuItems = [];
      mf.virtualKeyboardMode = 'manual';
      mf.showMenuToggle = false;
      // mf.showVirtualKeyboardToggle = false; // Property might not exist on element type, but attribute works
      mf.setAttribute('virtual-keyboard-mode', 'manual');
    }

    // Auto-focus on mount
    const timer = setTimeout(() => {
      // Only autofocus if not clean (clean usually means it is controlled externally or passive)
      // Or if user wants it.
      mf.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [clean]);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    // Listen for internal changes
    const handleInput = (evt: Event) => {
      const target = evt.target as any;
      onChange(target.value ?? '');
    };

    mf.addEventListener('input', handleInput);
    return () => {
      mf.removeEventListener('input', handleInput);
      // Ensure keyboard is closed on unmount
      const vk = getMathVirtualKeyboard();
      if (vk) vk.hide();
    };
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
      {clean && (
        <style dangerouslySetInnerHTML={{
          __html: `
            math-field::part(menu-toggle),
            math-field::part(virtual-keyboard-toggle),
            math-field::part(keycap),
            .ml-virtual-keyboard-toggle,
            .ml-menu-toggle {
              display: none !important;
              visibility: hidden !important;
              width: 0 !important;
              height: 0 !important;
              pointer-events: none !important;
            }
          `
        }} />
      )}
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
        menu-items={clean ? "none" : ""}
        virtual-keyboard-mode={clean ? "manual" : "onfocus"}
      />
    </div>
  );
}
