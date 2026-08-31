import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

// design.md: primary buttons are a solid accent fill (no outer glow); ghost
// buttons are a 1.5px outline. Hover = 8% darken + lift; active = -1px press.
export function GlassButton({ variant = 'primary', className, ...props }: GlassButtonProps) {
  const base =
    'rounded-control px-5 py-3 font-semibold text-body transition-all duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-40';

  const variants = {
    primary: 'bg-primary text-white shadow-none hover:brightness-90 hover:shadow-lift',
    ghost: 'border-[1.5px] border-primary text-primary hover:bg-primary/10',
  };

  return <button className={cn(base, variants[variant], className)} {...props} />;
}
