// Global TSX typings for MathLive custom element
// This makes <math-field> valid JSX in .tsx files.

import type { CSSProperties } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': {
        ref?: unknown;
        style?: CSSProperties;
        className?: string;
        value?: string;
        'read-only'?: boolean | string;
        onInput?: unknown;
        onKeyDown?: unknown;
        [key: string]: unknown;
      };
    }
  }

  interface Window {
    mathVirtualKeyboard: unknown;
  }
}

export {};
