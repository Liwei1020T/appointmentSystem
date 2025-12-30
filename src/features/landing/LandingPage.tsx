/**
 * 服务介绍页面 (Landing Page) - 2.0 优化版
 * 
 * 优化点：
 * - 增加 Floating Capsule Header (悬浮胶囊导航)
 * - 双栏 Hero 布局
 * - 强化 Trust Chips
 * - Highlights 轮播组件
 * - 统一间距与动效
 * - 新增：BrandMarquee (品牌墙)
 * - 新增：Spotlight Card (聚光灯交互)
 * - 新增：Bento Grid (便当盒布局)
 */

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Header from './components/Header';
import Hero from './components/Hero';
import BrandMarquee from './components/BrandMarquee'; // New
import Features from './components/Features';
import Steps from './components/Steps';
import Reviews from './components/Reviews';
import Highlights from './components/Highlights';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import HomePage from '@/features/home/HomePage';

export default function LandingPage() {
  const { data: session, status } = useSession();

  if (status === 'authenticated') {
    return <HomePage />;
  }

  if (status === 'loading') {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink text-text-primary font-sans selection:bg-accent/20 selection:text-accent">
      <Header />
      
      <main>
        <Hero />
        <BrandMarquee /> {/* Added Marquee */}
        <Features />
        <Steps />
        <Reviews />
        <Highlights />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
