/**
 * manifest.ts - PWA 配置
 * 
 * Next.js 14 App Router 约定文件
 * 用于生成 PWA manifest.json，支持"添加到主屏幕"功能
 */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'LW String Studio',
        short_name: 'LW String',
        description: 'LW 穿线工作室 — 在线预约、即时通知、积分优惠',
        start_url: '/',
        display: 'standalone',
        background_color: '#0F172A',
        theme_color: '#F97316',
        orientation: 'portrait',
        icons: [
            {
                src: '/images/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/images/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
        categories: ['sports', 'lifestyle', 'utilities'],
        lang: 'zh-CN',
    };
}
