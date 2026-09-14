
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import {
  addPlayer,
  removePlayer,
} from '@/lib/registration/actions';

import { DocumentUploadCard } from '@/components/registration/DocumentUploadCard';

interface PlayerDocument {
  id: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface PlayerManagerItem {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string | null;
  position: string | null;
  jerseyNumber: number | null;
  status: string;
  documents: PlayerDocument[];
}

interface PlayerManagerProps {
  registrationId: string;
  teamId: string;
  players: PlayerManagerItem[];
}

const MAX_PLAYERS = 10;
const MIN_PLAYERS = 8;

function getPlayerDocument(
  player: PlayerManagerItem,
  documentType: string,
) {
  return player.documents.some(
    (document) => document.documentType === documentType,
  );
}

function PlayerStatus({
  player,
}: {
  player: PlayerManagerItem;
}) {
  const hasId = getPlayerDocument(player, 'player_id_doc');
  const hasPhoto = getPlayerDocument(player, 'player_photo');

  const complete = hasId && hasPhoto;

  return (
    <div
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
        complete
          ? 'bg-primary/10 text-primary'
          : 'bg-amber-500/10 text-amber-300',
      ].join(' ')}
    >
      {complete ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}

      {complete ? 'Documents complete' : 'Documents required'}
    </div>
  );
}

export function PlayerManager({
  registrationId,
  teamId,
  players,
}: PlayerManagerProps) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(players.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState('');

  const playerCount = players.length;
  const atMaximum = playerCount >= MAX_PLAYERS;
  const minimumReached = playerCount >= MIN_PLAYERS;

  const handleAddPlayer = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (atMaximum) {
      setError('Maximum 10 players are allowed.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const form = event.currentTarget;
      const formData = new FormData(form);

      /*
       * Position has intentionally been removed from the UI.
       * The server action currently accepts an optional position,
       * so simply leaving it out keeps the database value null.
       */
      await addPlayer(formData, registrationId);

      form.reset();
      setShowForm(false);

      router.refresh();
    } catch (err) {
      console.error('Failed to add player:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to add the player. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    const player = players.find((item) => item.id === playerId);

    const playerName = player
      ? `${player.firstName} ${player.lastName}`
      : 'this player';

    const confirmed = window.confirm(
      `Are you sure you want to remove ${playerName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingPlayerId(playerId);
      setError('');

      await removePlayer(playerId, registrationId);

      router.refresh();
    } catch (err) {
      console.error('Failed to remove player:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to remove the player. Please try again.',
      );
    } finally {
      setRemovingPlayerId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Progress */}
      <section className="rounded-2xl border border-outline/30 bg-surface-container-low/50 p-5 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-on-surface">
                Team players
              </h2>

              <p className="mt-1 text-sm text-on-surface-variant">
                Add between 8 and 10 players to complete your team roster.
              </p>
            </div>
          </div>

          <div className="min-w-[180px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-on-surface">
                {playerCount} / {MAX_PLAYERS} players
              </span>

              <span
                className={
                  minimumReached
                    ? 'text-primary'
                    : 'text-amber-300'
                }
              >
                {minimumReached
                  ? 'Minimum reached'
                  : `${MIN_PLAYERS} required`}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (playerCount / MAX_PLAYERS) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">{error}</div>

          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-300/70 transition hover:text-red-200"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Player */}
      {!atMaximum && (
        <section className="overflow-hidden rounded-2xl border border-outline/30 bg-surface-container-low/50 shadow-xl shadow-black/10">
          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError('');
            }}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface-container/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
                <Plus className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-on-surface">
                  Add player
                </p>

                <p className="text-xs text-on-surface-variant">
                  Add a new player to your team roster.
                </p>
              </div>
            </div>

            <ChevronDown
              className={[
                'h-5 w-5 text-on-surface-variant transition-transform',
                showForm ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {showForm && (
            <div className="border-t border-outline/20 px-5 py-5">
              <form
                onSubmit={handleAddPlayer}
                className="space-y-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      First name
                    </label>

                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="First name"
                      className="w-full rounded-xl border border-outline/30 bg-surface-container-high/50 px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      Last name
                    </label>

                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Last name"
                      className="w-full rounded-xl border border-outline/30 bg-surface-container-high/50 px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  {/* ID */}
                  <div>
                    <label
                      htmlFor="idNumber"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      ID / passport number
                    </label>

                    <input
                      id="idNumber"
                      name="idNumber"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Enter ID or passport number"
                      className="w-full rounded-xl border border-outline/30 bg-surface-container-high/50 px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  {/* Jersey */}
                  <div>
                    <label
                      htmlFor="jerseyNumber"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                    >
                      Jersey number
                    </label>

                    <input
                      id="jerseyNumber"
                      name="jerseyNumber"
                      type="number"
                      required
                      min={1}
                      max={99}
                      placeholder="1–99"
                      className="w-full rounded-xl border border-outline/30 bg-surface-container-high/50 px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-outline/20 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={isSubmitting}
                    className="rounded-xl border border-outline/40 bg-surface-container-high/50 px-5 py-2.5 text-sm font-medium text-on-surface transition hover:border-outline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding player...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add player
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {/* Maximum reached */}
      {atMaximum && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />

          <div>
            <p className="text-sm font-semibold text-on-surface">
              Maximum roster reached
            </p>

            <p className="text-xs text-on-surface-variant">
              Your team has the maximum of {MAX_PLAYERS} players.
            </p>
          </div>
        </div>
      )}

      {/* Players */}
      <section className="space-y-4">
        {players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline/40 bg-surface-container-low/30 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
              <Users className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-on-surface">
              No players added yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
              Add your first player above. You need at least {MIN_PLAYERS}{' '}
              players before submitting the registration.
            </p>
          </div>
        ) : (
          players.map((player, index) => (
            <article
              key={player.id}
              className="overflow-hidden rounded-2xl border border-outline/30 bg-surface-container-low/50 shadow-xl shadow-black/10"
            >
              {/* Player header */}
              <div className="border-b border-outline/20 px-5 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-on-surface">
                          {player.firstName} {player.lastName}
                        </h3>

                        <PlayerStatus player={player} />
                      </div>

                      <div className="mt-1 text-xs text-on-surface-variant">
                        ID: {player.idNumber || 'Not provided'}
                        <span className="mx-2 opacity-40">•</span>
                        Jersey:{' '}
                        {player.jerseyNumber
                          ? `#${player.jerseyNumber}`
                          : 'Not assigned'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRemovePlayer(player.id)}
                    disabled={removingPlayerId === player.id}
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-300 transition hover:border-red-500/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                  >
                    {removingPlayerId === player.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}

                    Remove
                  </button>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4 bg-surface-container-low/20 p-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />

                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">
                      Player documents
                    </h4>

                    <p className="text-xs text-on-surface-variant">
                      Upload the player&apos;s ID document and passport-size
                      photo.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <DocumentUploadCard
                    teamId={teamId}
                    registrationId={registrationId}
                    playerId={player.id}
                    documentType="player_id_doc"
                    label="ID / Passport Copy"
                    icon="id"
                  />

                  <DocumentUploadCard
                    teamId={teamId}
                    registrationId={registrationId}
                    playerId={player.id}
                    documentType="player_photo"
                    label="Passport-Size Photo"
                    icon="photo"
                  />
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Bottom information */}
      <div className="rounded-xl border border-outline/20 bg-surface-container-low/30 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" />

          <div className="text-xs leading-5 text-on-surface-variant">
            <p>
              Each player must have an ID/passport document and a
              passport-size photo uploaded before the registration can be
              completed.
            </p>

            {!minimumReached && (
              <p className="mt-1 font-medium text-amber-300">
                You currently have {playerCount} player
                {playerCount === 1 ? '' : 's'}. Add at least{' '}
                {MIN_PLAYERS - playerCount} more to reach the minimum roster
                size.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerManager;
