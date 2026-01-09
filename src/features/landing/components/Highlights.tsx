'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Smartphone, QrCode, Truck } from 'lucide-react';
import { Button } from '@/components';
import { useRouter } from 'next/navigation';

const slides = [
  {
    id: 0,
    title: "在线预约 & 选线",
    desc: "选择您心仪的球线型号、颜色，并指定精准拉力磅数。系统自动匹配可用时段。",
    icon: <Smartphone className="w-12 h-12 text-accent" />,
    color: "bg-sky-50"
  },
  {
    id: 1,
    title: "TnG 扫码支付",
    desc: "订单确认后，使用 TnG eWallet 扫码即可完成支付，全程无现金接触，安全便捷。",
    icon: <QrCode className="w-12 h-12 text-accent" />,
    color: "bg-emerald-50"
  },
  {
    id: 2,
    title: "上门取送服务",
    desc: "没空出门？选择上门取送服务，专人上门取拍，穿线完成后送回府上。",
    icon: <Truck className="w-12 h-12 text-accent" />,
    color: "bg-lime-50"
  }
];

export default function Highlights() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const points = [
    "同等拉力标准，价格低于市场均价",
    "资深穿线师亲手操作，拒绝学徒练手",
    "透明价格体系，无任何隐形消费",
    "积分当钱花，老客户回馈更丰厚"
  ];

  return (
    <section className="py-20 md:py-24 bg-ink overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6 font-display">
              不仅是便宜，<br />
              更是对专业的执着
            </h2>
            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
              我们深知每一根球线对击球手感的影响。虽然价格亲民，但我们坚持使用顶级穿线设备和标准流程，确保您的装备始终处于最佳竞技状态。
            </p>
            
            <div className="space-y-4 mb-10">
              {points.map((point, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-accent mr-3 flex-shrink-0" />
                  <span className="text-text-secondary font-medium">{point}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => router.push('/signup')}
              variant="primary"
              className="px-8 py-3 text-lg font-semibold shadow-sm group"
            >
              立即体验超值服务 
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Right Content: Carousel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-3xl border border-border-subtle p-8 md:p-12 shadow-lg min-h-[400px] flex flex-col justify-between"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className={`w-24 h-24 mx-auto ${slides[currentSlide].color} rounded-full flex items-center justify-center mb-6`}>
                  {slides[currentSlide].icon}
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {slides[currentSlide].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center space-x-2 mt-8">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'bg-accent w-6' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
