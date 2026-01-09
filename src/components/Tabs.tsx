import React from 'react';

export interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

/**
 * Tabs component for switching between views
 * 
 * @param tabs - Array of tab objects
 * @param activeTab - Currently active tab ID
 * @param onChange - Tab change handler
 */
export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onChange,
  className = '' 
}) => {
  return (
    <div className={`p-1.5 rounded-full bg-ink border border-border-subtle ${className}`}>
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex-1 px-4 py-2 text-sm font-semibold rounded-full transition-all
              ${activeTab === tab.id
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'}
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
