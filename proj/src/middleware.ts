import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LANGUAGES, DEFAULT_LANGUAGE } from "./i18n/config";

const locales = LANGUAGES.map((l) => l.code);

const PUBLIC_FILE = /\.(.*)$/;

function getLocale(request: NextRequest): string {
    // 1. Check cookie
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    if (cookieLocale && locales.includes(cookieLocale as unknown)) {
        return cookieLocale;
    }

    // 2. Check Accept-Language header (Simple Parser)
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
        const preferredLocales = acceptLanguage
            .split(",")
            .map((lang) => {
                const [l] = lang.split(";");
                return l.trim().substring(0, 2).toLowerCase();
            });

        for (const lang of preferredLocales) {
            if (locales.includes(lang as unknown)) {
                return lang;
            }
        }
    }

    // 3. Fallback
    return DEFAULT_LANGUAGE;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip public files and API routes
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        PUBLIC_FILE.test(pathname)
    ) {
        return NextResponse.next();
    }

    // Check if pathname has locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (!pathnameHasLocale) {
        const locale = getLocale(request);
        // Redirect to locale path
        const url = new URL(`/${locale}${pathname === "/" ? "" : pathname}`, request.url);
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url);
    }

    // Supabase Auth Logic
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Strip locale for auth checks
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${pathname.split('/')[1]}`), "") || "/";

    // 1. Protected Routes (User)
    if (pathWithoutLocale.startsWith("/debate") && !user) {
        const locale = pathname.split("/")[1];
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // 2. Protected Routes (Admin)
    if (pathWithoutLocale.startsWith("/admin")) {
        if (!user) {
            const locale = pathname.split("/")[1];
            return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
        }

        // Role gate: only admin/super_admin/support can access /admin.
        // Support is limited to Messages only.
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role as string | undefined;
        const allowed = ['admin', 'super_admin', 'support'];

        if (profileErr || !role || !allowed.includes(role)) {
            const locale = pathname.split('/')[1];
            return NextResponse.redirect(new URL(`/${locale}/debate`, request.url));
        }

        if (role === 'support') {
            // Support can only access /admin/messages
            if (!pathWithoutLocale.startsWith('/admin/messages')) {
                const locale = pathname.split('/')[1];
                return NextResponse.redirect(new URL(`/${locale}/admin/messages`, request.url));
            }
        }
    }

    // 3. Auth Routes (Redirect if already logged in)
    if ((pathWithoutLocale.startsWith("/login") || pathWithoutLocale.startsWith("/register")) && user) {
        const locale = pathname.split("/")[1];
        return NextResponse.redirect(new URL(`/${locale}/debate`, request.url));
    }

    // Ensure cookie is synced with current locale path if present
    const locale = pathname.split('/')[1];
    if (locale && locales.includes(locale as unknown)) {
        response.cookies.set('NEXT_LOCALE', locale);
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
