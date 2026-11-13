// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // 👇 අපි ලොගින් පේජ් එකට යද්දී, හෝ Home එකට යද්දී මේ චෙක් එක කරන්නේ නැහැ (ඉක්මන් වෙන්න)
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/pricing') || // 👈 පැකේජ page එක හැමෝටම
    request.nextUrl.pathname.startsWith('/about') ||
    request.nextUrl.pathname.startsWith('/help') ||
    request.nextUrl.pathname.startsWith('/terms') ||
    request.nextUrl.pathname.startsWith('/privacy') ||
    request.nextUrl.pathname.startsWith('/site-map') ||
    request.nextUrl.pathname.startsWith('/safety') || // 👈 Safety Center — හැමෝටම
    request.nextUrl.pathname === '/browse' || // 👈 Login නැති අයටත් browse කරන්න (කැමැත්ත යවන්න login ඕනේ) // 👈 Site map (SEO) — හැමෝටම
    request.nextUrl.pathname.startsWith('/opengraph-image') || // 👈 Facebook / WhatsApp share පින්තූරය
    request.nextUrl.pathname.startsWith('/twitter-image') ||
    request.nextUrl.pathname.startsWith('/forgot-password') || // 👈 මුරපදය අමතක අයට login නැතුව එන්න
    request.nextUrl.pathname.startsWith('/auth/') || // 👈 Google / Facebook / email links (callback එකම login කරනවා)
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/') || // ⚡ API routes හැම එකක්ම තමන්ම login check කරනවා (කලින් මෙතනත් ආයේ check කළ නිසා හැම request එකක්ම පරක්කු වුණා)
    request.nextUrl.pathname.includes('.') // images, css etc.
  ) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚡ getClaims — login token එක මෙතනම verify කරනවා (getUser වගේ හැම page එකකටම Supabase server එකට යන්නේ නෑ → ඉක්මන්)
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims?.sub ?? null

  // ලොග් වෙලා නැත්නම් ලොගින් එකට යවනවා
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}