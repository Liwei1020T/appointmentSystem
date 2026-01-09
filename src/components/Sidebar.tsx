import React from 'react';

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

/**
 * Sidebar navigation component for admin dashboard
 * 
 * @param items - Array of sidebar items
 * @param className - Additional CSS classes
 */
export const Sidebar: React.FC<SidebarProps> = ({ items, className = '' }) => {
  return (
    <aside className={`w-64 h-screen bg-ink-surface border-r border-border-subtle p-4 ${className}`}>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
              ${item.active
                ? 'bg-accent/10 text-text-primary font-semibold border-l-4 border-accent -ml-px pl-[11px]'
                : 'text-text-secondary hover:bg-ink'}
            `}
            aria-current={item.active ? 'page' : undefined}
          >
            <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
            <span className="text-sm">{item.label}</span>
          </a>
        ))}
      </div>
    </aside>
  );
};
