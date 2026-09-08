import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass-card rounded-lg', className)} {...props} />;
}