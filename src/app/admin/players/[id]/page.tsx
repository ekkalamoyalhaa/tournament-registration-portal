'use client';

import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ReviewActionBar } from '@/components/admin/ReviewActionBar';

// PRD §24 — inspect one player's details and documents, approve/reject/request
// changes at the player level without touching the rest of the team.
// Document "View" opens a signed URL from getPlayerDocumentUrl() (60s expiry).
export default function AdminPlayerReviewPage({ params }: { params: { id: string } }) {
  const player = {
    name: decodeURIComponent(params.id),
    status: 'UNDER_REVIEW',
    dateOfBirth: '4 March 2001',
    nationality: 'MDV',
    position: 'Forward',
    jerseyNumber: 10,
    documents: [
      { id: 'doc-1', label: 'Passport', status: 'Uploaded' },
      { id: 'doc-2', label: 'Player photo', status: 'Uploaded' },
      { id: 'doc-3', label: 'Eligibility certificate', status: 'Uploaded' },
    ],
  };

  async function viewDocument(documentId: string) {
    // In production: fetch(`/api/admin/documents/${documentId}/url`) which
    // calls getPlayerDocumentUrl() server-side, then window.open the signed URL.
    console.log('requesting signed URL for', documentId);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-section">
      <Link href="/admin/teams/Island%20United%20FC" className="text-small text-white/50 hover:text-white/80">
        ← Back to team
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-h1 font-bold">{player.name}</h1>
        <StatusBadge status={player.status} />
      </div>

      <GlassCard className="mt-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-small">
          <Row label="Date of birth" value={player.dateOfBirth} />
          <Row label="Nationality" value={player.nationality} />
          <Row label="Position" value={player.position} />
          <Row label="Jersey number" value={String(player.jerseyNumber)} />
        </dl>

        <div className="mt-8 border-t border-glass-border pt-6">
          <h2 className="text-body font-semibold">Documents</h2>
          <div className="mt-4 space-y-3">
            {player.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-control border border-glass-border bg-white/5 px-4 py-3 text-small"
              >
                <span>{doc.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-white/50">{doc.status}</span>
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="px-3 py-1.5 text-small"
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
          onApprove={() => console.log('approve player', player.name)}
          onRequestChanges={(note) => console.log('request changes', player.name, note)}
          onReject={() => console.log('reject player', player.name)}
        />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-white/50">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
