'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { GlassButton } from '@/components/ui/GlassButton';

export interface PlayerRow {
  id: string;
  name: string;
  idNumber: string;
  position: string;
  jerseyNumber: number;
  status: string;
  hasIdDocument: boolean;
  hasPassportPhoto: boolean;
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
  const documentsComplete =
    player.hasIdDocument && player.hasPassportPhoto;

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-sans text-body-md font-medium text-on-surface">
            {player.name}
          </p>

          <p className="font-mono text-label-sm text-outline mt-0.5">
            ID: {player.idNumber} · {player.position} · #{player.jerseyNumber}
          </p>

          <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
            <span
              className={
                player.hasIdDocument
                  ? 'text-green-400'
                  : 'text-tertiary'
              }
            >
              {player.hasIdDocument ? '✓ ID uploaded' : '○ ID missing'}
            </span>

            <span
              className={
                player.hasPassportPhoto
                  ? 'text-green-400'
                  : 'text-tertiary'
              }
            >
              {player.hasPassportPhoto
                ? '✓ Photo uploaded'
                : '○ Photo missing'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
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

      {!documentsComplete && (
        <p className="mt-3 border-t border-white/5 pt-2 font-mono text-[11px] text-tertiary">
          Player documents are incomplete.
        </p>
      )}
    </div>
  );
}
