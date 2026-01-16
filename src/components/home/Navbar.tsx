'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import LangSwitcher from "@/components/lang-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
    lang: string;
    dict: {
        common: {
            siteName: string;
            login: string;
            register: string;
        };
        nav: {
            contact: string;
        };
    };
}

export default function Navbar({ lang, dict }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav
            className={`fixed top-0 w-full z-50 border-b border-border transition-all duration-300 ${isMenuOpen
                    ? 'h-screen bg-background'
                    : 'h-20 glass bg-background/80 backdrop-blur-md'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo & Brand */}
                <Link href={`/${lang}`} className="flex items-center gap-3 group z-50 active:scale-95 transition-transform">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Image
                            src="/logo.png"
                            alt="Jarnazi Logo"
                            width={120}
                            height={120}
                            className="relative rounded-xl border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300 w-10 h-10 md:w-14 md:h-14 object-contain"
                        />
                    </div>
                    <div className="text-xl md:text-2xl font-bold tracking-tight text-foreground whitespace-nowrap">
                        {dict.common.siteName}
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-4">
                    <LangSwitcher />
                    <ThemeToggle />
                    <Link href={`/${lang}/login`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                        {dict.common.login}
                    </Link>
                    <Link href={`/${lang}/register`} className="relative group inline-flex h-9 items-center justify-center overflow-hidden rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-all hover:bg-foreground/90 hover:scale-105 active:scale-95">
                        <span className="relative z-10">{dict.common.register}</span>
                        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-foreground z-50 rounded-md hover:bg-muted active:scale-95 transition-all"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Content */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full h-[calc(100vh-5rem)] bg-background flex flex-col justify-start items-center gap-8 overflow-y-auto pt-8 pb-20 animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6">
                        <div className="flex items-center gap-4 w-full justify-center">
                            <LangSwitcher />
                            <ThemeToggle />
                        </div>

                        <hr className="w-full border-border/50" />

                        <Link
                            href={`/${lang}/login`}
                            onClick={toggleMenu}
                            className="w-full text-center text-lg font-bold text-foreground hover:text-primary transition-colors py-4 border border-border rounded-xl hover:bg-muted/50"
                        >
                            {dict.common.login}
                        </Link>

                        <Link
                            href={`/${lang}/register`}
                            onClick={toggleMenu}
                            className="w-full text-center relative group inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-foreground px-5 text-lg font-bold text-background transition-all hover:bg-foreground/90 mx-auto"
                        >
                            <span className="relative z-10">{dict.common.register}</span>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
