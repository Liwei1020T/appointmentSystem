/**
 * robots.ts - 搜索引擎爬虫配置
 * 
 * Next.js 14 App Router 约定文件
 * 用于控制搜索引擎如何爬取网站
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://lwstringstudio.li-wei.net';

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/reviews',
                    '/reviews/featured',
                ],
                disallow: [
                    '/api/',
                    '/admin/',
                    '/profile/',
                    '/orders/',
                    '/payment/',
                    '/booking/',
                    '/packages/',
                    '/vouchers/',
                    '/points/',
                    '/referrals/',
                    '/login',
                    '/signup',
                    '/forgot-password',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
