import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every page request so signed-in shop
 * owners and administrators stay signed in. Server Components cannot write
 * cookies, so this is the only place an expired access token gets renewed.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not put code between createServerClient and getClaims: it validates the
  // token and triggers a refresh (and the cookie write above) when needed.
  try {
    await supabase.auth.getClaims();
  } catch {
    // Network failures must never block public search pages.
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static assets, images and the public analytics/search APIs.
    "/((?!_next/static|_next/image|api/search|api/analytics|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
