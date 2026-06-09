import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // Skip authentication for now
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
