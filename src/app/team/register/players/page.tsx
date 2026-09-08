'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { PlayerListItem } from '@/components/registration/PlayerListItem';
import { getPlayers, addPlayer, removePlayer } from '@/lib/registration/actions';
import { LogOut } from 'lucide-react';

const POSITIONS = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'] as const;

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  status: string;
}

export default function PlayersStepPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayers().then((data) => {
      setPlayers(data);
      setLoading(false);
    });
  }, []);

  async function handleAdd(formData: FormData) {
    try {
      const result = await addPlayer(formData);
      if (result.success && result.player) {
        setPlayers((prev) => [result.player as Player, ...prev]);
        setIsAdding(false);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to add player');
    }
  }

  async function handleRemove(id: string) {
    await removePlayer(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-[16px] md:px-[40px] py-[32px]">
        <p className="text-outline">Loading players…</p>
      </main>
    );
  }

  const canAdd = players.length < 10;
  const minMet = players.length >= 8;

  return (
    <main className="mx-auto max-w-2xl px-[16px] md:px-[40px] py-[32px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-label-sm text-primary-container">
            Team Details Submission — Step 2 of 3
          </p>
          <h1 className="font-sans text-headline-lg font-bold text-on-surface tracking-tight">Players</h1>
          <p className="mt-2 font-sans text-body-md text-outline">
            {players.length} of 10 players added {minMet ? '(minimum met)' : '(minimum 8 required)'}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 font-sans text-body-md text-outline hover:bg-white/[0.04] hover:text-on-surface transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-body-md font-medium text-on-surface">Squad</p>
            <p className={`font-mono text-label-sm ${minMet ? 'text-green-400' : 'text-tertiary'}`}>
              {minMet ? '✓ Minimum 8 players met' : `Need ${8 - players.length} more player(s)`}
            </p>
          </div>
          {canAdd && !isAdding && (
            <GlassButton type="button" onClick={() => setIsAdding(true)}>
              + Add player
            </GlassButton>
          )}
        </div>

        {isAdding && (
          <form
            action={handleAdd}
            className="mt-6 space-y-4 rounded-lg border border-white/5 bg-white/[0.02] p-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <input name="firstName" placeholder="First name" required className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30" />
              <input name="lastName" placeholder="Last name" required className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                name="position"
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30"
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p} className="bg-surface">
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <input name="jerseyNumber" placeholder="Jersey number" type="number" required className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30" />
            </div>
            <div className="flex justify-end gap-3">
              <GlassButton type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit">Add to roster</GlassButton>
            </div>
          </form>
        )}

        <div className="mt-6 space-y-2">
          {players.map((p) => (
            <PlayerListItem
              key={p.id}
              player={{
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                position: p.position ?? '—',
                jerseyNumber: p.jerseyNumber ?? 0,
                status: p.status,
              }}
              onEdit={() => {}}
              onRemove={handleRemove}
            />
          ))}
          {players.length === 0 && (
            <p className="rounded-lg border border-dashed border-white/10 p-6 text-center font-sans text-body-md text-outline italic">
              No players yet — add your first player to continue.
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-between border-t border-white/10 pt-6">
          <Link href="/team/register/officials">
            <GlassButton type="button" variant="ghost">Back</GlassButton>
          </Link>
          <Link href="/team/register/review">
            <GlassButton type="button">Continue to review</GlassButton>
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}