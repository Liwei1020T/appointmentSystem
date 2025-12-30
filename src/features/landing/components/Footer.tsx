'use client';

import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink border-t border-border-subtle py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <span className="text-xl font-bold text-text-primary tracking-tight">
              LW String Studio
            </span>
          </div>
          
          <div className="text-sm text-text-tertiary">
            © {year} LW String Studio. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
