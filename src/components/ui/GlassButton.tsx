import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export function GlassButton({ variant = 'primary', className, ...props }: GlassButtonProps) {
  const base =
    'rounded-lg px-5 py-3 font-display text-label-lg transition-all duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40';
  const variants = {
    primary:
      'bg-gold text-forest font-semibold hover:bg-gold-deep shadow-glow-gold',
    ghost:
      'border border-gold/50 text-gold hover:border-gold hover:bg-gold/10 hover:text-primary',
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}