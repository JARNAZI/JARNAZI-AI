import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LANGUAGES, DEFAULT_LANGUAGE } from '@/i18n/config';

const locales = LANGUAGES.map((lang) => lang.code);

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  // Simple parser for Accept-Language header
  const preferredLocales = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q] = lang.trim().split(';q=');
      return { code: code.split('-')[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const preferred of preferredLocales) {
    if (locales.includes(preferred.code as any)) {
      return preferred.code;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  // Preserve query parameters
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next), API routes, and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
