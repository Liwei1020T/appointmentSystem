'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export default function BreathingBackground({ className }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none select-none z-0", className)}>
      {/* Primary Blob (Accent) - Increased to 20% */}
      <motion.div
        animate={reduceMotion ? undefined : {
          x: [0, 100, -50, 0],
          y: [0, -50, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={reduceMotion ? undefined : {
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] opacity-80"
      />

      {/* Secondary Blob (Info) */}
      <motion.div
        animate={reduceMotion ? undefined : {
          x: [0, -70, 30, 0],
          y: [0, 60, -40, 0],
          scale: [1, 1.1, 0.8, 1],
        }}
        transition={reduceMotion ? undefined : {
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-[40%] right-[0%] w-[500px] h-[500px] bg-info/15 rounded-full blur-[90px] opacity-70"
      />

      {/* Tertiary Blob (Accent Alt) */}
      <motion.div
        animate={reduceMotion ? undefined : {
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={reduceMotion ? undefined : {
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute -bottom-[20%] left-[20%] w-[550px] h-[550px] bg-accent-alt/15 rounded-full blur-[110px] opacity-60"
      />
    </div>
  );
}
