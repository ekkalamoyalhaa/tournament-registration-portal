'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { GlassButton } from '@/components/ui/GlassButton';

export interface PlayerRow {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number;
  status: string;
}

export function PlayerListItem({
  player,
  onEdit,
  onRemove,
}: {
  player: PlayerRow;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <div>
        <p className="font-sans text-body-md font-medium text-on-surface">{player.name}</p>
        <p className="font-mono text-label-sm text-outline mt-0.5">
          {player.position} · #{player.jerseyNumber}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={player.status} />
        <GlassButton
          type="button"
          variant="ghost"
          className="px-3 py-1.5 text-label-md"
          onClick={() => onEdit(player.id)}
        >
          Edit
        </GlassButton>
        <button
          type="button"
          onClick={() => onRemove(player.id)}
          className="font-sans text-label-md text-outline hover:text-error transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}