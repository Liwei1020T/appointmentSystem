/**
 * middleware.ts - Next.js Edge Middleware
 * 
 * 功能：
 * 1. 路由保护：未登录用户重定向到登录页
 * 2. 管理员权限检查
 * 3. 安全头部注入 (CSP, X-Frame-Options 等)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 需要登录才能访问的路由
const protectedRoutes = [
    '/profile',
    '/orders',
    '/booking',
    '/payment',
    '/packages',
    '/vouchers',
    '/points',
    '/referrals',
];

// 需要管理员权限的路由
const adminRoutes = ['/admin'];

// 已登录用户不应访问的路由（重定向到首页）
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 获取用户 token (JWT)
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isLoggedIn = !!token;
    const isAdmin = token?.role === 'admin' || token?.role === 'super_admin';

    // 1. 已登录用户访问登录/注册页面 → 重定向到首页
    if (isLoggedIn && authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. 未登录用户访问受保护路由 → 重定向到登录页
    if (!isLoggedIn && protectedRoutes.some(route => pathname.startsWith(route))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. 非管理员访问管理后台 → 重定向到首页
    if (!isAdmin && adminRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. 创建响应并添加安全头部
    const response = NextResponse.next();

    // 安全头部
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // CSP 头部 (可根据需要调整)
    // response.headers.set(
    //   'Content-Security-Policy',
    //   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    // );

    return response;
}

// 配置 Matcher：指定 middleware 生效的路由
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|images|uploads|sw.js|manifest.json).*)',
    ],
};
