/**
 * 服务介绍页面 (Landing Page)
 * 
 * 功能：
 * - 展示羽毛球穿线服务介绍
 * - 突出核心功能与优势
 * - 引导用户登录或注册
 * - 移动优先响应式设计
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components';

export default function LandingPage() {
  const router = useRouter();

  // 核心功能列表
  const features = [
    {
      icon: '📱',
      title: '在线预约',
      description: '随时随地轻松预约穿线服务，无需电话等待',
    },
    {
      icon: '🎯',
      title: '专业服务',
      description: '专业穿线师，多种球线选择，精准拉力控制',
    },
    {
      icon: '📦',
      title: '套餐优惠',
      description: '购买套餐更优惠，积分兑换优惠券',
    },
    {
      icon: '🔔',
      title: '即时通知',
      description: 'SMS 短信通知订单状态，实时掌握进度',
    },
    {
      icon: '💰',
      title: '在线支付',
      description: '支持 TnG 等多种支付方式，安全便捷',
    },
    {
      icon: '⭐',
      title: '积分系统',
      description: '每次消费累积积分，兑换优惠券和礼品',
    },
  ];

  // 使用流程
  const steps = [
    {
      number: '1',
      title: '注册账户',
      description: '快速注册，填写基本信息',
    },
    {
      number: '2',
      title: '选择服务',
      description: '选择球线、拉力和时间',
    },
    {
      number: '3',
      title: '在线支付',
      description: '使用 TnG 等方式支付',
    },
    {
      number: '4',
      title: '等待完成',
      description: '收到通知后取球拍即可',
    },
  ];

  return (
    <div className="min-h-screen bg-ink text-text-primary">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-ink border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24">
          <div className="text-center">
            {/* Logo / Brand */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-ink text-3xl shadow-glow">
                🏸
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              专业羽毛球穿线服务
            </h1>

            <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
              在线预约 · 即时通知 · 积分优惠
              <br />
              让穿线更简单，让运动更专业
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                onClick={() => router.push('/signup')}
                variant="primary"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold shadow-glow"
              >
                立即注册
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="secondary"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold"
              >
                登录账户
              </Button>
            </div>

            <p className="text-sm text-text-tertiary">
              已有账户？
              <Link href="/login" className="text-accent hover:text-accent/80 font-medium ml-1">
                点击登录
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -z-10 opacity-20">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#D4FF00" d="M47.1,-57.1C59.9,-45.6,68.4,-29.2,71.8,-11.6C75.2,6,73.5,24.8,64.8,39.8C56.1,54.8,40.4,66,23.5,71.1C6.6,76.2,-11.5,75.2,-28.1,69.1C-44.7,63,-59.8,51.8,-68.4,36.4C-77,21,-79.1,1.4,-75.6,-16.5C-72.1,-34.4,-63,-50.6,-49.8,-61.9C-36.6,-73.2,-18.3,-79.6,-0.4,-79.1C17.5,-78.6,34.3,-68.6,47.1,-57.1Z" transform="translate(100 100)" />
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              为什么选择我们
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              专业、便捷、透明的羽毛球穿线服务平台
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-ink-surface rounded-2xl p-6 border border-border-subtle hover:border-accent-border transition-colors duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-ink-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              使用流程
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              简单4步，轻松完成穿线服务
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent text-ink text-2xl font-bold rounded-full mb-4 shadow-glow">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Highlights Section */}
      <section className="py-16 md:py-24 bg-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
                专业的穿线服务
              </h2>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p className="flex items-start">
                  <span className="text-accent mr-2 text-xl">✓</span>
                  <span>多种品牌球线选择，满足不同需求</span>
                </p>
                <p className="flex items-start">
                  <span className="text-accent mr-2 text-xl">✓</span>
                  <span>专业穿线师操作，精准拉力控制</span>
                </p>
                <p className="flex items-start">
                  <span className="text-accent mr-2 text-xl">✓</span>
                  <span>透明价格，套餐更优惠</span>
                </p>
                <p className="flex items-start">
                  <span className="text-accent mr-2 text-xl">✓</span>
                  <span>实时订单追踪，进度一目了然</span>
                </p>
                <p className="flex items-start">
                  <span className="text-accent mr-2 text-xl">✓</span>
                  <span>SMS 短信通知，不错过任何更新</span>
                </p>
              </div>
            </div>

            <div className="bg-ink-elevated rounded-3xl p-8 text-center border border-border-subtle">
              <div className="text-6xl mb-4">🎾</div>
              <h3 className="text-2xl font-bold text-text-primary mb-4">
                立即开始
              </h3>
              <p className="text-text-secondary mb-6">
                注册账户，享受专业穿线服务
              </p>
              <Button
                onClick={() => router.push('/signup')}
                variant="primary"
                className="w-full py-3 text-lg font-semibold"
              >
                免费注册
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-ink-elevated text-text-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-xl mb-8 text-text-secondary">
            立即注册，体验专业便捷的羽毛球穿线服务
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => router.push('/signup')}
              variant="primary"
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold"
            >
              立即注册
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="secondary"
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold"
            >
              已有账户？登录
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-text-tertiary py-8 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2025 LW String Studio
          </p>
        </div>
      </footer>
    </div>
  );
}
