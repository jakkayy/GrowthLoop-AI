import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch (err) {
      console.error("middleware JWT error:", err);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
