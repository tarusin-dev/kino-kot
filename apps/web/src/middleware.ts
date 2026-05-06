import { NextResponse, type NextRequest } from 'next/server';

const MAINTENANCE_PATH = '/maintenance';

export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === MAINTENANCE_PATH) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = MAINTENANCE_PATH;
  url.search = '';

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|icons|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
