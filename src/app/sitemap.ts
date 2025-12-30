/**
 * sitemap.ts - 网站地图生成
 * 
 * Next.js 14 App Router 约定文件
 * 动态生成 sitemap.xml 供搜索引擎索引
 */

import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://lwstringstudio.li-wei.net';

    // 静态页面
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/reviews`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/reviews/featured`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
    ];

    // 未来可扩展：动态获取公开评价页面
    // const reviews = await prisma.review.findMany({
    //   where: { isPublic: true },
    //   select: { id: true, updatedAt: true },
    // });
    // const reviewPages = reviews.map((review) => ({
    //   url: `${baseUrl}/reviews/${review.id}`,
    //   lastModified: review.updatedAt,
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.5,
    // }));

    return [...staticPages];
}
