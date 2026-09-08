'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-1 border-b border-white/10">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={cn(
              'px-4 py-3 font-mono text-label-md font-medium uppercase tracking-wider transition-colors',
              i === active
                ? 'border-b-2 border-primary-container text-on-surface'
                : 'text-outline hover:text-on-surface-variant'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs[active].content}</div>
    </div>
  );
}