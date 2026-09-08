'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { CheckCircle, AlertTriangle, LogOut } from 'lucide-react';
import { getReviewData, submitRegistration } from '@/lib/registration/actions';

export default function ReviewStepPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getReviewData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    const result = await submitRegistration();
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push('/team/dashboard');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center bg-background py-12 px-margin-mobile md:px-margin-desktop">
        <div className="w-full max-w-4xl">
          <p className="font-body-md text-on-surface-variant">Loading review…</p>
        </div>
      </main>
    );
  }

  const team = data.team;
  const reg = data.registration;
  const players = team?.players ?? [];
  const officialNames = [reg.managerName, reg.coachName, reg.medicName, reg.officialName].filter(Boolean);
  const totalDocCount = data.totalDocCount ?? 0;

  const checklist = [
    { label: 'Team', done: !!team?.name && team.name !== 'Draft Team' },
    { label: 'Institution type', done: !!team?.institutionType },
    { label: 'Division', done: !!reg?.division },
    { label: 'Officials', detail: `${officialNames.length} of 4`, done: officialNames.length === 4 },
    { label: 'Players', detail: `${players.length} players`, done: players.length >= 8 && players.length <= 10 },
    { label: 'Documents', detail: `${totalDocCount} uploaded`, done: totalDocCount > 0 },
  ];
  const readyToSubmit = checklist.every((i) => i.done);

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background py-12 px-margin-mobile md:px-margin-desktop">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="mb-12 flex items-start justify-between">
          <div>
            <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-primary">
              Team Details Submission — Step 3 of 3
            </p>
            <h1 className="font-display-lg text-display-lg text-on-surface">
              Registration review
            </h1>
            <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
              Check everything below before submitting for final review.
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn-ghost flex items-center gap-2 rounded-lg px-4 py-2 font-label-md text-label-md"
          >
            <LogOut size={18} /> Sign out
          </button>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-body-md text-body-md text-error">
            {error}
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-0">
          {checklist.map((item, idx) => (
            <div
              key={item.label}
              className={`flex items-center justify-between py-5 ${
                idx < checklist.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <span className="font-body-md text-body-md text-on-surface">
                {item.label}
              </span>
              <span
                className={`flex items-center gap-2 font-label-sm text-label-sm ${
                  item.done ? 'text-green-400' : 'text-on-surface-variant'
                }`}
              >
                {item.done ? (
                  <CheckCircle size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )}
                {item.detail ?? (item.done ? 'Complete' : 'Incomplete')}
              </span>
            </div>
          ))}
        </div>

        {/* Status Banner */}
        <div
          className={`mt-8 rounded-lg border px-6 py-4 text-center font-label-md text-label-md font-medium ${
            readyToSubmit
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-outline-variant/30 bg-white/[0.03] text-on-surface-variant'
          }`}
        >
          {readyToSubmit ? 'Ready to submit' : 'Some sections still need attention'}
        </div>

        {/* Actions */}
        <div className="mt-12 flex items-center justify-between border-t border-outline-variant/20 pt-8">
          <Link href="/team/register/players">
            <button
              type="button"
              className="btn-ghost rounded-lg px-6 py-3 font-label-md text-label-md font-bold"
            >
              Back
            </button>
          </Link>
          <button
            type="button"
            disabled={!readyToSubmit || submitting}
            onClick={handleSubmit}
            className={`rounded-lg px-8 py-3 font-label-md text-label-md font-bold transition-all duration-300 ${
              readyToSubmit && !submitting
                ? 'btn-primary text-on-primary-fixed hover:-translate-y-0.5'
                : 'cursor-not-allowed border border-white/10 bg-white/[0.03] text-on-surface-variant'
            }`}
          >
            {submitting ? 'Submitting…' : 'Submit registration'}
          </button>
        </div>
      </div>
    </main>
  );
}