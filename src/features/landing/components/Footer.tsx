'use client';

import React from 'react';
import { MessageCircle, MapPin, Clock } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const quickLinks = [
    { name: '服务特色', id: 'features' },
    { name: '使用流程', id: 'steps' },
    { name: '用户评价', id: 'reviews' },
    { name: '常见问题', id: 'faq' },
  ];

  return (
    <footer className="bg-ink border-t border-border-subtle">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <BrandLogo size="sm" showName />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              居家穿线师工作室，用最实惠的价格，带给你最专业的穿线体验。告别门店溢价，享受冠军级手艺。
            </p>
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <MapPin className="w-4 h-4" />
              <span>马来西亚 · 居家服务</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-text-primary mb-4">快速导航</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-sm text-text-secondary hover:text-accent transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="md:col-span-1">
            <h4 className="font-semibold text-text-primary mb-4">联系我们</h4>
            <div className="space-y-3">
              <a
                href="https://wa.me/60123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent transition-colors group"
              >
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                </div>
                <span>WhatsApp 咨询</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-text-tertiary">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <span>周一至周日 9:00 - 21:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-text-tertiary">
              © {year} LW String Studio. All rights reserved.
            </div>
            <div className="text-xs text-text-tertiary">
              专业穿线 · 价格实惠 · 服务到家
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
