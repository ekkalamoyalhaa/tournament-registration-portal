import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

// design.md "Cards": subtly rounded corners, translucent surface, 1px light
// border, backdrop blur 10-20px, subtle shadow. No pure black anywhere.
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-control border border-glass-border bg-glass shadow-card backdrop-blur-glass',
        'p-6',
        className
      )}
      {...props}
    />
  );
}
