import type React from 'react';

export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
        'aria-label'?: string;
      };
    }
  }
}
