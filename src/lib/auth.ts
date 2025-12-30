/**
 * NextAuth.js v5 Configuration
 * Credentials-based authentication with Prisma adapter
 *
 * Current auth mode:
 * - Phone number + password (no email)
 * - Forgot password: OTP verification + reset password
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { isValidMyPhone, toMyCanonicalPhone } from "@/lib/phone";
import { normalizeMyPhone } from "@/lib/utils";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
        // Optional fields used for signup + admin login
        admin: { label: "Admin Login", type: "text" },
      },
      async authorize(credentials) {
        /**
         * Credentials Authorize - Phone + Password
         *
         * Data flow:
         * - Client calls signIn('credentials', { phone, password, admin? })
         */
        const phoneInput = String(credentials?.phone || "");
        const passwordInput = String(credentials?.password || "");
        const requireAdmin = String(credentials?.admin || "").toLowerCase() === "true";

        if (!phoneInput.trim() || !passwordInput.trim()) {
          throw new Error("请输入手机号和密码");
        }
        if (!isValidMyPhone(phoneInput)) {
          throw new Error("手机号格式无效");
        }

        const phoneDigits = normalizeMyPhone(phoneInput);
        const canonicalPhone = toMyCanonicalPhone(phoneDigits);

        // Lookup user by phone (support legacy stored formats)
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ phone: canonicalPhone }, { phone: phoneDigits }],
          },
        });

        if (!user) {
          throw new Error("手机号或密码错误");
        }

        // Admin login requires admin/super_admin
        if (requireAdmin && user.role !== "admin" && user.role !== "super_admin") {
          throw new Error("权限不足，仅限管理员访问");
        }

        // If account has no password yet, guide user to reset via OTP
        if (!user.password) {
          throw new Error("账户未设置密码，请使用“忘记密码”重置");
        }

        const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
        if (!isPasswordValid) {
          throw new Error("手机号或密码错误");
        }

        // Best-effort normalize stored phone format to canonical.
        if (user.phone !== canonicalPhone) {
          await prisma.user
            .update({
              where: { id: user.id },
              data: { phone: canonicalPhone },
            })
            .catch(() => null);
        }

        return {
          id: user.id,
          email: user.email || undefined,
          name: user.fullName || undefined,
          role: user.role,
          phone: user.phone || canonicalPhone,
          full_name: user.fullName || undefined,
          referral_code: user.referralCode || undefined,
          points: user.points ?? 0,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Extended fields for client UI convenience
        token.phone = (user as any).phone ?? token.phone;
        token.full_name = (user as any).full_name ?? token.full_name;
        token.referral_code = (user as any).referral_code ?? token.referral_code;
        token.points = (user as any).points ?? token.points;
      }
      return token;
    },
    async session({ session, token }) {
      /**
       * Session callback:
       * - Ensure session.user has a stable `id` + `role`.
       * - Enrich with profile fields (phone, points, referral code) used across the UI.
       */
      if (session.user && token.id) {
        const userId = String(token.id);
        session.user.id = userId;

        // Fetch latest user snapshot to avoid stale JWT fields.
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            fullName: true,
            phone: true,
            role: true,
            referralCode: true,
            points: true,
            createdAt: true,
          },
        });

        session.user.role = String(dbUser?.role || token.role || "user");
        (session.user as any).email = dbUser?.email ?? null;
        (session.user as any).name = dbUser?.fullName ?? session.user.name ?? null;
        (session.user as any).full_name = dbUser?.fullName ?? null;
        (session.user as any).phone = dbUser?.phone ?? null;
        (session.user as any).referral_code = dbUser?.referralCode ?? null;
        (session.user as any).points = dbUser?.points ?? 0;
        (session.user as any).created_at = dbUser?.createdAt ?? null;
      }
      return session;
    },
  },
});
