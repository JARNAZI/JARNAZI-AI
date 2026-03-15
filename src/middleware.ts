import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LANGUAGES, DEFAULT_LANGUAGE } from '@/i18n/config';

const locales = LANGUAGES.map((lang) => lang.code);

function getLocale(request: NextRequest): string {
  // Check cookie first for consistency
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

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

import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 1. Update Supabase session (refreshes token if needed)
  let response = await updateSession(request);

  const { pathname } = request.nextUrl;
  const locale = getLocale(request);

  // Define protected routes
  const protectedRoutes = ['/debate', '/admin', '/profile', '/buy-tokens', '/neural-hub'];
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(`/${locale}${route}`) || 
    pathname === `/${locale}${route}` ||
    pathname.includes(route) // Fallback for various patterns
  );

  // Initialize Supabase for session check
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  let user = null;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // In middleware, we don't need to set cookies here as updateSession already does it
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data?.user;
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // prevent caching of protected pages
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // Handle auth routes (redirect to debate if already logged in)
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => pathname.includes(route));
  
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL(`/${locale}/debate`, request.url));
  }

  // 2. Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return response;

  // 3. Redirect if there is no locale
  const redirectUrl = new URL(`/${locale}${pathname}`, request.url);

  // Preserve query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next), API routes, auth callbacks, and static files
    '/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
