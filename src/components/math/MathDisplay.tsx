'use client';

import 'mathlive';

// Declare custom element for TypeScript


interface MathDisplayProps {
    content: string;
}

export function MathDisplay({ content }: MathDisplayProps) {    // Detect Math delimiters for MathLive rendering

    // Helper to parse content
    // Splits by $$ block $$ or $ inline $
    // Added protection against escaped dollars if needed, but simple split usually suffices for this context
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$)/g);

    return (
        <div className="prose prose-invert max-w-none break-words">
            {parts.map((part, i) => {
                if (part.startsWith('$')) {
                    // Strip delimiters for MathLive
                    const cleanMath = part.replace(/^\$\$?|\$\$?$/g, '');
                    const isBlock = part.startsWith('$$');
                    return (
                        <math-field
                            key={i}
                            read-only={true}
                            style={{
                                display: isBlock ? 'block' : 'inline-block',
                                width: isBlock ? '100%' : 'auto',
                                margin: isBlock ? '1.5em 0' : '0 0.2em',
                                background: isBlock ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                border: isBlock ? '1px solid rgba(99, 102, 241, 0.1)' : 'none',
                                borderRadius: isBlock ? '0.75rem' : '0',
                                padding: isBlock ? '1.25rem' : '0',
                                fontSize: isBlock ? '1.1em' : 'inherit'
                            }}
                        >
                            {cleanMath}
                        </math-field>
                    );
                }
                return <span key={i} className="whitespace-pre-wrap">{part}</span>;
            })}
        </div>
    );
}
