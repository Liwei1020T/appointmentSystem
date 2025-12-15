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
    <div className={`border-b border-slate-200 ${className}`}>
      <div className="flex gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              pb-3 px-1 font-medium text-sm border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-600 hover:text-slate-900'}
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
