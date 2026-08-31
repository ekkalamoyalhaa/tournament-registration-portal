import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { WizardSteps } from '@/components/registration/WizardSteps';
import { DocumentUploadRow } from '@/components/registration/DocumentUploadRow';

// PRD §14 — required documents are configurable per tournament; this reads
// as a flattened per-player checklist so nothing gets missed before submit.
export default function DocumentsStepPage() {
  const requirements = [
    { key: 'passport-1', label: 'Passport / ID', playerName: 'John Smith' },
    { key: 'photo-1', label: 'Player photograph', playerName: 'John Smith' },
    { key: 'passport-2', label: 'Passport / ID', playerName: 'Ahmed Ali' },
    { key: 'photo-2', label: 'Player photograph', playerName: 'Ahmed Ali' },
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-section">
      <WizardSteps currentStep={6} />

      <GlassCard className="mt-8">
        <h1 className="text-h1 font-bold">Documents</h1>
        <p className="mt-2 text-small text-white/60">
          Uploads go straight to secure storage — nothing is ever shown publicly.
        </p>

        <div className="mt-6 space-y-3">
          {requirements.map((r) => (
            <DocumentUploadRow key={r.key} requirement={r} />
          ))}
        </div>

        <div className="mt-8 flex justify-between border-t border-glass-border pt-6">
          <Link href="/team/register/players">
            <GlassButton type="button" variant="ghost">Back</GlassButton>
          </Link>
          <Link href="/team/register/review">
            <GlassButton type="button">Continue to review</GlassButton>
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
