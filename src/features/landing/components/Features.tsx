'use client';

import React from 'react';
import { cubicBezier, motion } from 'framer-motion';
import { Smartphone, Target, TrendingDown, Truck, QrCode, Gift } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: '在线预约',
    description: '随时随地轻松预约，系统自动匹配空闲时段，告别繁琐沟通。',
    bg: 'bg-accent/10', text: 'text-accent',
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: '大师级手艺',
    description: '每一根线都经过精准校调，杜绝掉磅，手感媲美专业队标准。',
    bg: 'bg-info/10', text: 'text-info',
  },
  {
    icon: <TrendingDown className="w-8 h-8" />,
    title: '价格碾压',
    description: '去除门店溢价，同等品质比传统店铺便宜 30% 以上。',
    bg: 'bg-warning/10', text: 'text-warning',
  },
  {
    icon: <Truck className="w-8 h-8" />,
    title: '上门取送',
    description: '忙碌没时间？我们提供专业上门取拍与送回服务，足不出户搞定一切。',
    bg: 'bg-success/10', text: 'text-success',
  },
  {
    icon: <QrCode className="w-8 h-8" />,
    title: '扫码支付',
    description: '支持 TnG eWallet 扫码支付，安全快捷。',
    bg: 'bg-accent/10', text: 'text-accent',
  },
  {
    icon: <Gift className="w-8 h-8" />,
    title: '积分当钱花',
    description: '消费自动累积积分，随时兑换超值优惠券，越用越省。',
    bg: 'bg-accent-alt/20', text: 'text-accent-alt',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: cubicBezier(0.16, 1, 0.3, 1) }
  }
};

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-24 bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-text-primary mb-4 font-display"
          >
            为什么选择我们
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-text-secondary max-w-2xl mx-auto"
          >
            打造专业、透明、便捷的穿线体验
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="h-full"
            >
              <SpotlightCard className="h-full p-6 md:p-8 flex flex-col hover:shadow-card-hover transition-shadow duration-300 bg-white">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.text}`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 font-display">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
