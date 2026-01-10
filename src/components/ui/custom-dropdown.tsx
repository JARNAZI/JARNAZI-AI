"use client";

import React, { useState, useEffect, useRef, useContext, createContext } from 'react';

interface DropdownContextType {
    isOpen: boolean;
    close: () => void;
}

const DropdownContext = createContext<DropdownContextType>({
    isOpen: false,
    close: () => { },
});

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    width?: string;
}

export function Dropdown({ trigger, children, align = 'right', width = 'w-56' }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const close = () => setIsOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <DropdownContext.Provider value={{ isOpen, close }}>
            <div className="relative inline-block text-left" ref={dropdownRef}>
                <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                    {trigger}
                </div>

                {isOpen && (
                    <div
                        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 ${width} origin-top-right rounded-xl glass border border-border shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
                    >
                        <div className="py-1 bg-background/80 backdrop-blur-xl">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </DropdownContext.Provider>
    );
}

export function DropdownItem({ onClick, children, className = "", icon: Icon, autoClose = true }: { onClick?: () => void, children: React.ReactNode, className?: string, icon?: any, autoClose?: boolean }) {
    const { close } = useContext(DropdownContext);

    return (
        <button
            onClick={(e) => {
                if (onClick) onClick();
                if (autoClose) close();
            }}
            className={`group flex w-full items-center px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors ${className}`}
        >
            {Icon && <Icon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary" />}
            {children}
        </button>
    );
}

export function DropdownLabel({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`px-4 py-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase ${className}`}>
            {children}
        </div>
    );
}

export function DropdownSeparator({ className = "" }: { className?: string }) {
    return <div className={`h-px my-1 bg-border ${className}`} />;
}
