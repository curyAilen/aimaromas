import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-cambialo-en-produccion"
);

async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("mezo_session")?.value;

    // Rutas de la tienda pública (no requieren login)
    const publicRoutes = ["/", "/producto", "/carrito", "/checkout"];
    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // Login (ruta especial)
    const isLoginPage = pathname === "/admin/login";

    // 1. Si está en /admin/login y ya está logueado → redirigir a /admin
    if (isLoginPage) {
        if (token) {
            const session = await verifyToken(token);
            if (session) {
                return NextResponse.redirect(new URL("/admin", req.url));
            }
        }
        return NextResponse.next();
    }

    // 2. Si está en una ruta pública
    if (isPublicRoute) {
        // Si está en "/" y está logueado → redirigir a /admin
        if (pathname === "/" && token) {
            const session = await verifyToken(token);
            if (session) {
                return NextResponse.redirect(new URL("/admin", req.url));
            }
        }
        return NextResponse.next();
    }

    // 3. Rutas /admin/* requieren login
    if (pathname.startsWith("/admin")) {
        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }

        const session = await verifyToken(token);
        if (!session) {
            const res = NextResponse.redirect(new URL("/admin/login", req.url));
            res.cookies.delete("mezo_session");
            return res;
        }

        return NextResponse.next();
    }

    // 4. Cualquier otra ruta (no clasificada) → dejar pasar
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)"],
};