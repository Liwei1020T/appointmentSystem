'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components';
import { MessageSquare, QrCode, TrendingDown } from 'lucide-react';
import BreathingBackground from './BreathingBackground';

export default function Hero() {
  const router = useRouter();

  const trustChips = [
    { icon: <TrendingDown className="w-4 h-4" />, text: "比市面便宜 30%" },
    { icon: <MessageSquare className="w-4 h-4" />, text: "全程 SMS 通知" },
    { icon: <QrCode className="w-4 h-4" />, text: "TnG 扫码支付" },
  ];

  return (
    <section className="relative overflow-hidden bg-ink pt-32 pb-20 md:pt-40 md:pb-32 lg:min-h-[800px] flex items-center">
      {/* Animated Background */}
      <BreathingBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text & CTA */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              冠军级穿线手艺 · 亲民价格
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6 tracking-tight leading-[1.1]">
              用更低的价格，
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400 mt-2">
                享受顶级拉力手感
              </span>
            </h1>

            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
              告别传统店铺的高溢价。我们通过线上预约模式降低成本，将<strong>最高性价比</strong>和<strong>最精准的穿线技术</strong>直接回馈给每一位球友。
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Button
                onClick={() => router.push('/signup')}
                variant="primary"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold shadow-glow hover:shadow-glow-lg transition-all hover:-translate-y-0.5"
              >
                立即预约 (首单优惠)
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="secondary"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-white border border-border-subtle hover:bg-gray-50"
              >
                登录账户
              </Button>
            </div>

            {/* Trust Chips */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6">
              {trustChips.map((chip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-center gap-2 text-text-secondary text-sm font-medium"
                >
                  <div className="text-accent">{chip.icon}</div>
                  {chip.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Abstract Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="hidden lg:block relative"
          >
            {/* Main Card: Simulate Order Status */}
            <div className="relative z-20 bg-white rounded-2xl shadow-glow-lg border border-border-subtle p-6 max-w-sm mx-auto rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">🏸</div>
                <div>
                  <div className="font-bold text-text-primary">我的球拍 - Yonex 100ZZ</div>
                  <div className="text-xs text-text-secondary">订单号 #20250101</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-accent"></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">穿线中 (26 lbs)</span>
                  <span className="font-medium text-accent">精准无掉磅</span>
                </div>
              </div>
            </div>

            {/* Float Card: SMS Notification */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-4 top-10 z-30 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-border-subtle p-4 w-64"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <TrendingDown size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">超值提醒</div>
                  <div className="text-sm text-text-primary">恭喜！本次穿线比市面均价节省了 RM 15.00</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
