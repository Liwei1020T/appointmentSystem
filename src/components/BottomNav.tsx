import React from 'react';

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
}

/**
 * Bottom navigation component for mobile apps
 * 
 * @param items - Array of navigation items
 */
export const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb z-40">
      <div className="flex items-center justify-around h-16">
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 transition-colors
              ${item.active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}
            `}
            aria-current={item.active ? 'page' : undefined}
          >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};
