/**
 * 健康检查端点 (Health Check Endpoint)
 * GET /api/health
 *
 * 用途：
 * - 负载均衡器健康检测
 * - 容器编排 (Docker/K8s) 健康探测
 * - 监控系统存活检测
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
  };
}

// 记录服务启动时间
const startTime = Date.now();

export async function GET() {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: {
        status: 'up',
      },
    },
  };

  // 检查数据库连接
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database.latency = Date.now() - dbStart;
    health.checks.database.status = 'up';
  } catch (error) {
    health.checks.database.status = 'down';
    health.checks.database.error =
      error instanceof Error ? error.message : 'Database connection failed';
    health.status = 'unhealthy';
  }

  // 根据状态返回不同的 HTTP 状态码
  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
