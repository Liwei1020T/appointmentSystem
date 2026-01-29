'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Button } from '@/components';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/BrandLogo';

export default function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  // 监听滚动位置
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: '特色', id: 'features' },
    { name: '流程', id: 'steps' },
    { name: '评价', id: 'reviews' },
    { name: '常见问题', id: 'faq' },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out",
        isScrolled ? "py-3" : "py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between rounded-full border border-border-subtle dark:border-gray-700 px-4 h-14 transition-all duration-300",
            isScrolled
              ? "bg-white/90 dark:bg-dark-elevated/90 backdrop-blur-md shadow-sm"
              : "bg-white/70 dark:bg-dark-elevated/70 backdrop-blur"
          )}
        >

        {/* Logo Section */}
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <BrandLogo size="sm" showName className="group-hover:opacity-90 transition-opacity" nameClassName="font-display" />
        </div>

        {/* Links (Inserted directly into the header layout) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => scrollToSection(link.id)}
              className="text-sm font-medium text-text-secondary dark:text-gray-400 hover:text-accent transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-100 px-3 py-2 transition-colors hidden sm:block"
          >
            登录
          </Link>
          <Button
            onClick={() => router.push('/signup')}
            variant="primary"
            size="sm"
            className="shadow-sm text-sm px-5"
          >
            注册
          </Button>
        </div>
        </div>
      </div>
    </motion.header>
  );
}
