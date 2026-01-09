'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Settings2, Truck, BellRing } from 'lucide-react';
import BreathingBackground from './BreathingBackground';

const steps = [
  {
    icon: <UserPlus className="w-6 h-6" />,
    title: '注册账户',
    description: '填写基本信息，开启会员权益。',
  },
  {
    icon: <Settings2 className="w-6 h-6" />,
    title: '选择服务',
    description: '选择球线、磅数，预约上门取送或自送。',
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: '取送/自送',
    description: '等待专人上门取拍，或自行送往门店。',
  },
  {
    icon: <BellRing className="w-6 h-6" />,
    title: '完成取拍',
    description: '收到通知后等待送回，或前往门店自取。',
  },
];

export default function Steps() {
  return (
    <section id="steps" className="py-20 md:py-24 bg-ink relative overflow-hidden">
      {/* Background - Flipped vertically for variety */}
      <BreathingBackground className="scale-y-[-1] opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-text-primary mb-4 font-display"
          >
            简单四步，轻松搞定
          </motion.h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            标准化流程，让每一次体验都流畅无阻
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className="relative group"
            >
              {/* Connector Line (Desktop only) */}
              {index < steps.length - 1 && (
                <motion.div 
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="hidden lg:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-border-subtle to-transparent origin-left -z-10"
                ></motion.div>
              )}

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-border-subtle text-center hover:shadow-card-hover hover:border-accent-border transition-all duration-300 h-full flex flex-col items-center">
                <div className="w-16 h-16 bg-accent text-text-onAccent rounded-2xl flex items-center justify-center mb-5 shadow-sm transform group-hover:-translate-y-1 transition-transform duration-300">
                  {step.icon}
                </div>
                <div className="absolute top-4 right-4 text-xs font-mono text-text-tertiary opacity-30">
                  0{index + 1}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
