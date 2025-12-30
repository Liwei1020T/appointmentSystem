/**
 * Open Graph 动态图片生成
 * 
 * 生成 1200x630 社交分享图片
 * 用于 WhatsApp/Facebook/Twitter 分享预览
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LW String Studio — 羽毛球穿线工作室';
export const contentType = 'image/png';
export const size = {
    width: 1200,
    height: 630,
};

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                {/* 主 Logo 区域 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40,
                    }}
                >
                    <div
                        style={{
                            width: 100,
                            height: 100,
                            background: '#F97316',
                            borderRadius: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 60,
                            boxShadow: '0 0 60px rgba(249, 115, 22, 0.4)',
                        }}
                    >
                        🏸
                    </div>
                </div>

                {/* 标题 */}
                <div
                    style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: '#E2E8F0',
                        marginBottom: 16,
                        textAlign: 'center',
                    }}
                >
                    LW String Studio
                </div>

                {/* 副标题 */}
                <div
                    style={{
                        fontSize: 28,
                        color: '#94A3B8',
                        marginBottom: 40,
                        textAlign: 'center',
                    }}
                >
                    在线预约 · 即时通知 · 积分优惠
                </div>

                {/* 特点标签 */}
                <div
                    style={{
                        display: 'flex',
                        gap: 20,
                    }}
                >
                    {['TNG支付', '专业穿线', '快速服务'].map((tag) => (
                        <div
                            key={tag}
                            style={{
                                background: 'rgba(249, 115, 22, 0.15)',
                                border: '1px solid rgba(249, 115, 22, 0.4)',
                                borderRadius: 12,
                                padding: '12px 24px',
                                fontSize: 20,
                                color: '#F97316',
                            }}
                        >
                            {tag}
                        </div>
                    ))}
                </div>

                {/* 品牌名 */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        fontSize: 24,
                        color: '#64748B',
                    }}
                >
                    LW String Studio
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
