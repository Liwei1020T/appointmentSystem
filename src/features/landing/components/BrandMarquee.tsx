'use client';

import React from 'react';
import { motion } from 'framer-motion';

const brands = [
  "YONEX", "VICTOR", "LI-NING", "挥拍一击","GOSEN"
];

export default function BrandMarquee() {
  return (
    <section className="py-10 bg-ink border-b border-border-subtle overflow-hidden relative">
      {/* Gradient Masks for Fade Effect */}
      <div className="absolute top-0 left-0 w-20 md:w-32 h-full bg-gradient-to-r from-ink to-transparent z-10"></div>
      <div className="absolute top-0 right-0 w-20 md:w-32 h-full bg-gradient-to-l from-ink to-transparent z-10"></div>

      <div className="flex">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex whitespace-nowrap"
        >
          {/* Duplicate list to create seamless loop */}
          {[...brands, ...brands, ...brands, ...brands].map((brand, index) => (
            <div
              key={index}
              className="inline-flex items-center justify-center mx-8 md:mx-12 opacity-40 hover:opacity-80 transition-opacity cursor-default"
            >
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-text-primary/20 hover:text-accent transition-colors font-sans italic">
                {brand}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
