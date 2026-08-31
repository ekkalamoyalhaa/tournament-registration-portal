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

// PRD §12 player list interface, e.g.:
//   John Smith / Forward | #10 / UNDER REVIEW
export function PlayerListItem({ player, onEdit, onRemove }: {
  player: PlayerRow;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-control border border-glass-border bg-white/5 px-4 py-3">
      <div>
        <p className="font-medium">{player.name}</p>
        <p className="text-small text-white/60">
          {player.position} · #{player.jerseyNumber}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={player.status} />
        <GlassButton type="button" variant="ghost" className="px-3 py-1.5 text-small" onClick={() => onEdit(player.id)}>
          Edit
        </GlassButton>
        <button
          type="button"
          onClick={() => onRemove(player.id)}
          className="text-small text-white/50 hover:text-tertiary"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
