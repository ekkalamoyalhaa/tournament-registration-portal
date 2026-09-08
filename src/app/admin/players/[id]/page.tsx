'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReviewActionBar } from '@/components/admin/ReviewActionBar';

export default function AdminPlayerReviewPage({ params }: { params: { id: string } }) {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/players/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function viewDocument(documentId: string) {
    const res = await fetch(`/api/admin/documents/${documentId}/url`);
    const { url } = await res.json();
    if (url) window.open(url, '_blank');
  }

  if (loading) {
    return (
      <div className="py-8">
        <p className="font-sans text-body-md text-outline">Loading player...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="py-8">
        <p className="font-sans text-body-md text-outline">Player not found</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/players" className="font-sans text-body-md text-outline hover:text-on-surface-variant">
        ← Back to players
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-sans text-headline-lg font-bold text-secondary-container tracking-tight">
          {player.firstName} {player.lastName}
        </h1>
        <StatusBadge status={player.status} />
      </div>

      <GlassCard className="mt-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-body-md">
          <Row label="Date of birth" value={player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : '—'} />
          <Row label="Nationality" value={player.nationality ?? '—'} />
          <Row label="Position" value={player.position ?? '—'} />
          <Row label="Jersey number" value={player.jerseyNumber ? String(player.jerseyNumber) : '—'} />
          <Row label="Team" value={player.team?.name ?? '—'} />
          <Row label="Email" value={player.email ?? '—'} />
        </dl>

        <div className="mt-8 border-t border-white/10 pt-6">
          <h2 className="font-mono text-label-md uppercase tracking-widest text-outline">Documents</h2>
          <div className="mt-4 space-y-2">
            {player.documents?.length === 0 && (
              <p className="font-sans text-body-md text-outline/40 italic">No documents uploaded</p>
            )}
            {player.documents?.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-body-md"
              >
                <span className="capitalize text-on-surface">{doc.documentType.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-label-sm text-outline">
                    {doc.changeRequestNote ? 'Changes requested' : 'Uploaded'}
                  </span>
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="px-3 py-1.5 text-label-md"
                    onClick={() => viewDocument(doc.id)}
                  >
                    View
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="mt-6">
        <ReviewActionBar
          onApprove={() => console.log('approve player', player.id)}
          onRequestChanges={(note) => console.log('request changes', player.id, note)}
          onReject={() => console.log('reject player', player.id)}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-outline">{label}</dt>
      <dd className="mt-0.5 font-medium text-on-surface">{value}</dd>
    </div>
  );
}