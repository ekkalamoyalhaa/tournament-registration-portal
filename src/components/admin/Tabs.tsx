'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-1 border-b border-glass-border">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={cn(
              'px-4 py-3 text-small font-medium transition-colors',
              i === active ? 'border-b-2 border-primary text-white' : 'text-white/50 hover:text-white/80'
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
