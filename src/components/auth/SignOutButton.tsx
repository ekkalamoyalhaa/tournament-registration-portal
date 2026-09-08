'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 rounded-lg border border-gold/30 bg-forest-deep/60 px-4 py-2 font-display text-label-md text-gold backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/10"
    >
      <LogOut size={20} /> Sign out
    </button>
  );
}