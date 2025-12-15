/**
 * Admin Login API Route
 * POST /api/admin/auth/login
 * 管理员登录验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signIn } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '请输入邮箱和密码' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 验证角色
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: '权限不足，仅限管理员访问' },
        { status: 403 }
      );
    }

    // 验证密码
    if (!user.password) {
      return NextResponse.json(
        { error: '账户配置异常，请联系系统管理员' },
        { status: 500 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 使用NextAuth登录
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (authError) {
      console.error('NextAuth sign in error:', authError);
      return NextResponse.json(
        { error: '登录失败，请重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
