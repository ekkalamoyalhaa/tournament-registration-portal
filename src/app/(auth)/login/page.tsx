import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-md items-center px-6">
      <GlassCard className="w-full">
        <h1 className="text-h1 font-bold">Sign in</h1>
        <p className="mt-2 text-small text-white/60">Manage your team&apos;s registration.</p>
        <form className="mt-8 space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-control border border-glass-border bg-white/5 px-4 py-3 text-body outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-control border border-glass-border bg-white/5 px-4 py-3 text-body outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          <GlassButton type="submit" className="w-full">Sign in</GlassButton>
        </form>
      </GlassCard>
    </main>
  );
}
