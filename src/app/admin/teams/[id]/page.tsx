'use client';

import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/admin/Tabs';
import { ReviewActionBar } from '@/components/admin/ReviewActionBar';

// PRD §23 — admin opens a team, reads its tabs, and takes one review action.
// Real data would come from a server component fetch by params.id; kept as a
// client component with example data so the review flow is interactive here.
export default function AdminTeamReviewPage({ params }: { params: { id: string } }) {
  const team = {
    name: 'Island United FC',
    status: 'UNDER_REVIEW',
    country: 'Maldives',
    city: 'Malé',
    contactEmail: 'club@islandunited.mv',
    manager: { name: 'Fathimath Nasheeda', position: 'Team Manager', email: 'nasheeda@islandunited.mv' },
    players: [
      { name: 'John Smith', position: 'Forward', jerseyNumber: 10, status: 'UNDER_REVIEW' },
      { name: 'Ahmed Ali', position: 'Midfielder', jerseyNumber: 7, status: 'APPROVED' },
      { name: 'David Jones', position: 'Defender', jerseyNumber: 23, status: 'CHANGES_REQUESTED' },
    ],
    documents: [
      { label: 'Team logo', status: 'Uploaded' },
      { label: '18 player photos', status: 'Uploaded' },
      { label: '17 of 18 ID documents', status: 'Missing one' },
    ],
    activity: [
      { at: '12 Nov 2026 10:21', text: 'Team Manager uploaded passport for John Smith.' },
      { at: '11 Nov 2026 16:02', text: 'Admin requested a passport replacement for David Jones.' },
      { at: '11 Nov 2026 15:40', text: 'Team submitted registration.' },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-section">
      <Link href="/admin/dashboard" className="text-small text-white/50 hover:text-white/80">
        ← Back to dashboard
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold">{team.name}</h1>
          <p className="mt-1 text-small text-white/60">
            {team.city}, {team.country}
          </p>
        </div>
        <StatusBadge status={team.status} />
      </div>

      <GlassCard className="mt-8">
        <Tabs
          tabs={[
            {
              label: 'Team information',
              content: (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-small">
                  <Row label="Team name" value={team.name} />
                  <Row label="Country" value={team.country} />
                  <Row label="City" value={team.city} />
                  <Row label="Contact email" value={team.contactEmail} />
                </dl>
              ),
            },
            {
              label: 'Manager',
              content: (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-small">
                  <Row label="Name" value={team.manager.name} />
                  <Row label="Position" value={team.manager.position} />
                  <Row label="Email" value={team.manager.email} />
                </dl>
              ),
            },
            {
              label: 'Players',
              content: (
                <div className="space-y-3">
                  {team.players.map((p) => (
                    <Link
                      key={p.name}
                      href={`/admin/players/${encodeURIComponent(p.name)}`}
                      className="flex items-center justify-between rounded-control border border-glass-border bg-white/5 px-4 py-3 hover:border-primary/50"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-small text-white/60">
                          {p.position} · #{p.jerseyNumber}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </Link>
                  ))}
                </div>
              ),
            },
            {
              label: 'Documents',
              content: (
                <div className="space-y-3">
                  {team.documents.map((d) => (
                    <div
                      key={d.label}
                      className="flex items-center justify-between rounded-control border border-glass-border bg-white/5 px-4 py-3 text-small"
                    >
                      <span>{d.label}</span>
                      <span className="text-white/60">{d.status}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              label: 'Activity',
              content: (
                <ul className="space-y-4">
                  {team.activity.map((event) => (
                    <li key={event.at} className="text-small">
                      <p className="text-white/40">{event.at}</p>
                      <p className="mt-0.5 text-white/85">{event.text}</p>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      </GlassCard>

      <div className="mt-6">
        <ReviewActionBar
          onApprove={() => console.log('approve team', params.id)}
          onRequestChanges={(note) => console.log('request changes', params.id, note)}
          onReject={() => console.log('reject team', params.id)}
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
