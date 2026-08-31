'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { WizardSteps } from '@/components/registration/WizardSteps';
import { FormField } from '@/components/ui/FormField';
import { PlayerListItem, type PlayerRow } from '@/components/registration/PlayerListItem';

const POSITIONS = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'] as const;

// PRD §12/§13 — add/edit/remove players client-side; the actual create/update
// calls go through modules/players/service.ts (addPlayer/updatePlayer) once
// wired to a real session + team id.
export default function PlayersStepPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([
    { id: '1', name: 'John Smith', position: 'Forward', jerseyNumber: 10, status: 'UNDER_REVIEW' },
    { id: '2', name: 'Ahmed Ali', position: 'Midfielder', jerseyNumber: 7, status: 'APPROVED' },
  ]);
  const [isAdding, setIsAdding] = useState(false);

  function addPlayer(form: FormData) {
    const firstName = String(form.get('firstName') ?? '');
    const lastName = String(form.get('lastName') ?? '');
    const position = String(form.get('position') ?? '');
    const jerseyNumber = Number(form.get('jerseyNumber') ?? 0);

    setPlayers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `${firstName} ${lastName}`.trim(),
        position: position.charAt(0) + position.slice(1).toLowerCase(),
        jerseyNumber,
        status: 'DRAFT',
      },
    ]);
    setIsAdding(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-section">
      <WizardSteps currentStep={5} />

      <GlassCard className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 font-bold">Players</h1>
            <p className="mt-2 text-small text-white/60">{players.length} players added</p>
          </div>
          {!isAdding && (
            <GlassButton type="button" onClick={() => setIsAdding(true)}>
              + Add player
            </GlassButton>
          )}
        </div>

        {isAdding && (
          <form
            action={addPlayer}
            className="mt-6 space-y-4 rounded-control border border-glass-border bg-white/5 p-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name" name="firstName" required />
              <FormField label="Last name" name="lastName" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-small font-medium text-white/85">Position</span>
                <select
                  name="position"
                  className="mt-2 w-full rounded-control border border-glass-border bg-white/5 px-4 py-3 text-body text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p} className="bg-ink">
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
              <FormField label="Jersey number" name="jerseyNumber" type="number" required />
            </div>
            <div className="flex justify-end gap-3">
              <GlassButton type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit">Add to roster</GlassButton>
            </div>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {players.map((p) => (
            <PlayerListItem
              key={p.id}
              player={p}
              onEdit={() => {}}
              onRemove={(id) => setPlayers((prev) => prev.filter((pl) => pl.id !== id))}
            />
          ))}
          {players.length === 0 && (
            <p className="rounded-control border border-dashed border-glass-border p-6 text-center text-small text-white/50">
              No players yet — add your first player to continue.
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-between border-t border-glass-border pt-6">
          <Link href="/team/register/manager">
            <GlassButton type="button" variant="ghost">Back</GlassButton>
          </Link>
          <Link href="/team/register/documents">
            <GlassButton type="button">Continue to documents</GlassButton>
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
