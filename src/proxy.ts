import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PROTECTED_ROUTES = ["/account", "/checkout", "/seller/dashboard", "/seller/register"]
const ADMIN_ROUTES = ["/admin"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create a response we can mutate cookies on
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate session server-side (getUser makes a network call to Supabase)
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAdmin = ADMIN_ROUTES.some(route => pathname.startsWith(route))

  if ((isProtected || isAdmin) && !user) {
    const loginUrl = new URL("/auth", request.url)
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/seller/dashboard/:path*",
    "/seller/register",
    "/admin/:path*",
  ],
}
