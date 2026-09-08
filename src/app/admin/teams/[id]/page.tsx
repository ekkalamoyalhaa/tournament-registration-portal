'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  getTeamDetail,
  approveSlot,
  rejectSlot,
  reviewTeamRegistration,
  reviewPlayer,
} from '@/lib/admin/actions';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';

type Tab = 'overview' | 'players' | 'documents' | 'activity';

export default function AdminTeamReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    getTeamDetail(params.id).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSlotApprove() {
    setActionLoading(true);
    try {
      await approveSlot(params.id, note || undefined);
      router.refresh();
      const refreshed = await getTeamDetail(params.id);
      setData(refreshed);
      setNote('');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSlotReject() {
    if (!rejectReason) return;
    setActionLoading(true);
    try {
      await rejectSlot(params.id, rejectReason);
      router.refresh();
      const refreshed = await getTeamDetail(params.id);
      setData(refreshed);
      setRejectReason('');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTeamAction(action: 'approve' | 'reject' | 'request_changes') {
    setActionLoading(true);
    try {
      await reviewTeamRegistration(params.id, action, note || undefined);
      router.refresh();
      const refreshed = await getTeamDetail(params.id);
      setData(refreshed);
      setNote('');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePlayerAction(playerId: string, action: 'approve' | 'reject' | 'request_changes') {
    await reviewPlayer(playerId, action);
    router.refresh();
    const refreshed = await getTeamDetail(params.id);
    setData(refreshed);
  }

  async function viewDocument(docId: string) {
    const res = await fetch(`/api/admin/documents/${docId}/url`);
    if (!res.ok) return;
    const { url } = await res.json();
    window.open(url, '_blank');
  }

  if (loading || !data) {
    return (
      <main className="mx-auto max-w-4xl px-[16px] md:px-[40px] py-[32px]">
        <p className="text-outline">Loading…</p>
      </main>
    );
  }

  const team = data.team;
  const players = team.players ?? [];
  const docs = players.flatMap((p: any) =>
    p.documents.map((d: any) => ({ ...d, playerName: `${p.firstName} ${p.lastName}` }))
  );
  const isPhase1 = data.phase === 'PHASE_1';
  const isPhase2 = data.phase === 'PHASE_2';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'players', label: `Players (${players.length})` },
    { key: 'documents', label: `Documents (${docs.length})` },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <main className="mx-auto max-w-4xl px-[16px] md:px-[40px] py-[32px]">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1 font-sans text-body-md text-outline hover:text-on-surface transition-colors"
      >
        <ArrowLeft size={14} /> Back to teams
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-headline-lg font-bold text-on-surface tracking-tight">
            {team.name}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <StatusBadge status={data.status} />
            <span className="font-mono text-label-sm text-outline">
              {data.phase === 'PHASE_1' ? 'Tournament Participation' : 'Team Details Submission'} ·{' '}
              {data.division === 'MENS' ? "Men's" : data.division === 'WOMENS' ? "Women's" : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b border-white/10 pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-sans text-body-md font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-container text-primary-container'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-6 space-y-6">
          <GlassCard>
            <h2 className="font-sans text-title-lg font-bold text-on-surface">Team information</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="font-mono text-label-sm text-outline">Name</dt>
                <dd className="font-sans text-body-md text-on-surface">{team.name}</dd>
              </div>
              <div>
                <dt className="font-mono text-label-sm text-outline">Institution</dt>
                <dd className="font-sans text-body-md text-on-surface">
                  {team.institutionType?.replace('_', ' ') ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-label-sm text-outline">Division</dt>
                <dd className="font-sans text-body-md text-on-surface">
                  {data.division === 'MENS' ? "Men's Division" : data.division === 'WOMENS' ? "Women's Division" : '—'}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-label-sm text-outline">Country</dt>
                <dd className="font-sans text-body-md text-on-surface">{team.country ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-mono text-label-sm text-outline">City</dt>
                <dd className="font-sans text-body-md text-on-surface">{team.city ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-mono text-label-sm text-outline">Contact email</dt>
                <dd className="font-sans text-body-md text-on-surface">{team.contactEmail ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-mono text-label-sm text-outline">Contact phone</dt>
                <dd className="font-sans text-body-md text-on-surface">{team.contactPhone ?? '—'}</dd>
              </div>
            </dl>
          </GlassCard>

          {isPhase1 && (
            <GlassCard>
              <h2 className="font-sans text-title-lg font-bold text-on-surface">Slot approval</h2>
              <p className="mt-2 font-sans text-body-md text-outline">
                Review institution eligibility before approving this team for Phase 2.
              </p>
              <div className="mt-4">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Approval note (optional)…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30 min-h-[80px]"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <GlassButton
                  type="button"
                  onClick={handleSlotApprove}
                  disabled={actionLoading}
                  className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                >
                  <CheckCircle size={14} className="mr-1" /> Approve slot
                </GlassButton>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason (required)…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-error/50 focus:ring-1 focus:ring-error/30 min-h-[80px]"
                />
                <GlassButton
                  type="button"
                  onClick={handleSlotReject}
                  disabled={actionLoading || !rejectReason}
                  className="mt-3 border-error/30 bg-error/10 text-error hover:bg-error/20"
                >
                  <XCircle size={14} className="mr-1" /> Reject slot
                </GlassButton>
              </div>
            </GlassCard>
          )}

          {isPhase2 && (
            <GlassCard>
              <h2 className="font-sans text-title-lg font-bold text-on-surface">Officials</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="font-mono text-label-sm text-outline">Manager</dt>
                  <dd className="font-sans text-body-md text-on-surface">{data.managerName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-mono text-label-sm text-outline">Coach</dt>
                  <dd className="font-sans text-body-md text-on-surface">{data.coachName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-mono text-label-sm text-outline">Medic</dt>
                  <dd className="font-sans text-body-md text-on-surface">{data.medicName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-mono text-label-sm text-outline">Official</dt>
                  <dd className="font-sans text-body-md text-on-surface">{data.officialName ?? '—'}</dd>
                </div>
              </dl>
            </GlassCard>
          )}

          {isPhase2 && (
            <GlassCard>
              <h2 className="font-sans text-title-lg font-bold text-on-surface">Final review actions</h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)…"
                className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30 min-h-[80px]"
              />
              <div className="mt-4 flex gap-3">
                <GlassButton
                  type="button"
                  onClick={() => handleTeamAction('approve')}
                  disabled={actionLoading}
                  className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                >
                  <CheckCircle size={14} className="mr-1" /> Approve
                </GlassButton>
                <GlassButton
                  type="button"
                  onClick={() => handleTeamAction('request_changes')}
                  disabled={actionLoading}
                  className="border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/20"
                >
                  <AlertTriangle size={14} className="mr-1" /> Request changes
                </GlassButton>
                <GlassButton
                  type="button"
                  onClick={() => handleTeamAction('reject')}
                  disabled={actionLoading}
                  className="border-error/30 bg-error/10 text-error hover:bg-error/20"
                >
                  <XCircle size={14} className="mr-1" /> Reject
                </GlassButton>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {tab === 'players' && (
        <div className="mt-6 space-y-2">
          {players.map((p: any) => (
            <GlassCard key={p.id} className="flex items-center justify-between">
              <div>
                <p className="font-sans text-body-md font-medium text-on-surface">
                  {p.firstName} {p.lastName}
                </p>
                <p className="font-mono text-label-sm text-outline mt-0.5">
                  {p.position ?? '—'} · #{p.jerseyNumber ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                {isPhase2 && (
                  <>
                    <button
                      onClick={() => handlePlayerAction(p.id, 'approve')}
                      className="font-sans text-label-md text-green-400 hover:underline"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handlePlayerAction(p.id, 'request_changes')}
                      className="font-sans text-label-md text-tertiary hover:underline"
                    >
                      Changes
                    </button>
                    <button
                      onClick={() => handlePlayerAction(p.id, 'reject')}
                      className="font-sans text-label-md text-error hover:underline"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
          {players.length === 0 && (
            <p className="text-center font-sans text-body-md text-outline italic py-8">
              No players.
            </p>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="mt-6 space-y-2">
          {docs.map((d: any) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div>
                <p className="font-sans text-body-md font-medium text-on-surface">
                  {d.originalFilename}
                </p>
                <p className="font-mono text-label-sm text-outline">
                  {d.playerName} · {d.documentType} · {(d.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => viewDocument(d.id)}
                className="flex items-center gap-1"
              >
                <Eye size={14} /> View
              </GlassButton>
            </div>
          ))}
          {docs.length === 0 && (
            <p className="text-center font-sans text-body-md text-outline italic py-8">
              No documents.
            </p>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="mt-6 space-y-2">
          {data.events.map((e: any) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div>
                <p className="font-sans text-body-md text-on-surface">
                  {e.fromStatus} → {e.toStatus}
                </p>
                {e.note && <p className="font-sans text-body-md text-outline mt-0.5">{e.note}</p>}
              </div>
              <p className="font-mono text-label-sm text-outline">
                {new Date(e.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {data.events.length === 0 && (
            <p className="text-center font-sans text-body-md text-outline italic py-8">
              No activity yet.
            </p>
          )}
        </div>
      )}
    </main>
  );
}