'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 font-label-md text-label-md text-primary-fixed-dim backdrop-blur-3xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
    >
      <LogOut size={20} /> Sign out
    </button>
  );
}