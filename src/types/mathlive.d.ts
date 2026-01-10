import React from 'react';

declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements {
                'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                    'read-only'?: boolean | string;
                    'value'?: string;
                };
            }
        }
    }

    interface Window {
        mathVirtualKeyboard: any;
    }
}
