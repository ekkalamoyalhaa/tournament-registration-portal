'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Users, UserCircle, LogOut } from 'lucide-react';

export function AdminSidebar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/teams', icon: Users, label: 'Teams' },
    { href: '/admin/players', icon: UserCircle, label: 'Players' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] backdrop-blur-3xl bg-surface/80 border-r border-white/10 flex flex-col py-2 justify-between z-40 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div>
        <div className="px-6 py-8 flex flex-col gap-1">
          <h1 className="font-sans text-headline-md font-bold text-on-surface tracking-tight">Tournament</h1>
          <p className="font-mono text-label-sm text-outline uppercase tracking-widest">ADMIN PORTAL</p>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 p-4 rounded-r-lg transition-all duration-300 ${
                  isActive
                    ? 'text-primary-fixed-dim font-bold bg-white/5 border-l-4 border-primary-container hover:bg-white/10 hover:text-primary'
                    : 'text-on-surface-variant font-medium border-l-4 border-transparent hover:bg-white/10 hover:text-primary'
                }`}
              >
                <Icon size={20} />
                <span className="font-sans text-body-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-3 pb-6 pt-4 border-t border-white/5">
        <div className="px-4 py-3 mb-2">
          <p className="font-mono text-label-sm text-secondary-container">{userName}</p>
          <p className="font-mono text-label-sm text-outline uppercase tracking-widest text-[10px]">
            {role.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-on-surface-variant font-medium p-4 flex items-center gap-3 hover:bg-white/10 hover:text-primary transition-all duration-300 rounded-lg"
        >
          <LogOut size={20} />
          <span className="font-sans text-body-md">Sign out</span>
        </button>
      </div>
    </aside>
  );
}