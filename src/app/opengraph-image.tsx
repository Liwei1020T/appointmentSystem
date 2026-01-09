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
                    background: 'linear-gradient(135deg, #F6F4F1 0%, #FFFFFF 100%)',
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
                            background: '#16A34A',
                            borderRadius: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 60,
                            color: '#FFFFFF',
                            fontWeight: 700,
                            boxShadow: '0 0 60px rgba(22, 163, 74, 0.35)',
                        }}
                    >
                        LW
                    </div>
                </div>

                {/* 标题 */}
                <div
                    style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: '#111827',
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
                        color: '#4B5563',
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
                                background: 'rgba(22, 163, 74, 0.12)',
                                border: '1px solid rgba(22, 163, 74, 0.35)',
                                borderRadius: 12,
                                padding: '12px 24px',
                                fontSize: 20,
                                color: '#16A34A',
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
                        color: '#9CA3AF',
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
