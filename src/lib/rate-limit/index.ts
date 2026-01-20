/**
 * 内存 Rate Limiter (Memory-based Rate Limiter)
 *
 * 简单的滑动窗口速率限制器
 * 适用于单实例部署，生产环境建议使用 Redis
 *
 * 使用方法:
 * const limiter = new RateLimiter({ interval: 60000, limit: 10 });
 * const result = limiter.check(ip);
 * if (!result.allowed) return errorResponse('Too many requests');
 */

interface RateLimitOptions {
  /** 时间窗口 (毫秒) */
  interval: number;
  /** 窗口内最大请求数 */
  limit: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly interval: number;
  private readonly limit: number;

  constructor(options: RateLimitOptions) {
    this.interval = options.interval;
    this.limit = options.limit;

    // 定期清理过期条目，防止内存泄漏
    setInterval(() => this.cleanup(), options.interval);
  }

  /**
   * 检查请求是否被允许
   * @param key 唯一标识符 (通常是 IP 地址)
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // 如果没有记录或已过期，创建新记录
    if (!entry || now >= entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + this.interval,
      });
      return {
        allowed: true,
        remaining: this.limit - 1,
        resetAt: now + this.interval,
      };
    }

    // 增加计数
    entry.count += 1;

    if (entry.count > this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: this.limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * 清理过期条目
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// 预配置的限制器实例

/**
 * 认证相关 API 限制器
 * 每分钟最多 5 次请求 (登录/注册/OTP)
 */
export const authLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 分钟
  limit: 5,
});

/**
 * OTP 请求限制器
 * 每分钟最多 3 次请求 (防止短信轰炸)
 */
export const otpLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 分钟
  limit: 3,
});

/**
 * 通用 API 限制器
 * 每分钟最多 60 次请求
 */
export const apiLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 分钟
  limit: 60,
});

/**
 * 从请求中提取客户端 IP
 */
export function getClientIp(request: Request): string {
  // 优先使用 X-Forwarded-For (代理/负载均衡器)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // 备用: X-Real-IP (Nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 最后: 使用默认值
  return 'unknown';
}

/**
 * 速率限制响应
 */
export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      success: false,
      message: '请求过于频繁，请稍后再试',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}
