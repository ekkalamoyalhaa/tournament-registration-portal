import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export function GlassButton({ variant = 'primary', className, ...props }: GlassButtonProps) {
  const base =
    'rounded-lg px-5 py-3 font-sans text-body-md font-medium transition-all duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40';
  const variants = {
    primary:
      'bg-primary-container text-on-primary-container hover:brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.15)]',
    ghost:
      'border border-white/10 text-primary hover:border-primary-container/50 hover:bg-white/5',
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}