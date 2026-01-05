'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components';
import BreathingBackground from './BreathingBackground';

export default function FinalCTA() {
  const router = useRouter();

  return (
    <section className="py-24 bg-ink relative overflow-hidden">
      {/* Background */}
      <BreathingBackground className="opacity-70 scale-x-[-1]" />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-accent/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            还在等什么？
          </h2>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            现在就注册你的账户，试一次你就知道什么叫稳。
            <br className="hidden md:block" />
            让你的每一拍杀球都更有力！
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => router.push('/signup')}
              variant="primary"
              className="w-full sm:w-auto px-10 py-4 text-lg font-semibold shadow-glow hover:shadow-glow-lg transition-all"
            >
              立即注册
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="secondary"
              className="w-full sm:w-auto px-10 py-4 text-lg font-semibold border border-border-subtle hover:bg-ink-surface bg-white/80 backdrop-blur-sm"
            >
              登录账户
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}