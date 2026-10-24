import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session on every page request so Server Components always
// see a valid access token. Server Components cannot write cookies, so this is the
// only place a rotated refresh token can be persisted for page navigations.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
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

  // getUser() validates the token with Supabase Auth and triggers a refresh when needed.
  const { data: { user } } = await supabase.auth.getUser();

  // Send shop owners straight to the right screen: "Add shop" opens My shop when the user already
  // has one, and My shop asks for sign-in or a new shop otherwise. Pages repeat these checks; doing it
  // here redirects before the loading screen streams. Only page loads (GET) are redirected, never
  // Server Action posts.
  const path = request.nextUrl.pathname;
  if (request.method === "GET" && (path === "/business/register" || path === "/dashboard" || path.startsWith("/dashboard/"))) {
    const { data: shop } = user ? await supabase.from("merchants").select("id").eq("user_id", user.id).maybeSingle() : { data: null };
    const target = path === "/business/register" ? (shop ? "/dashboard" : null) : (shop ? null : "/business/register");
    if (target) {
      const redirect = NextResponse.redirect(new URL(target, request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
