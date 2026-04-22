import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeInternalPath } from "@/lib/safe-redirect";

// Client-set UX marker only. Firebase Auth + Firestore Rules are the real data boundary.
const UX_SESSION_COOKIE = "jpf-session";
const PROTECTED = [
  "/dashboard",
  "/receitas",
  "/despesas",
  "/contas-a-pagar",
  "/dividas",
  "/relatorios",
  "/configuracoes",
];

export function middleware(request: NextRequest) {
  const sessionMarker = request.cookies.get(UX_SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !sessionMarker) {
    const url = new URL("/login", request.url);
    const next = safeInternalPath(`${pathname}${request.nextUrl.search}`);
    if (next !== "/dashboard") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
