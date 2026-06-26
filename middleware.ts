import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth removed — all routes are public, middleware is a pass-through
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
