'use client';

import React from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ items, activeId, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex border-3 border-primary bg-card p-1 ${className}`}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-headline uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-accent text-primary border-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
