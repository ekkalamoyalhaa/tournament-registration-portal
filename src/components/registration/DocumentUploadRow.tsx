'use client';

import { useState } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';

export interface DocumentRequirement {
  key: string;
  label: string;
  playerName: string;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

// Calls POST /api/uploads/presign, then PUTs the file straight to R2 —
// the file body never touches this app's own server (PRD §17).
export function DocumentUploadRow({ requirement }: { requirement: DocumentRequirement }) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setState('uploading');
    setFileName(file.name);
    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: 'demo-team',
          tournamentId: 'demo-tournament',
          kind: 'player-document',
          mimeType: file.type,
          size: file.size,
        }),
      });
      if (!presignRes.ok) throw new Error('Could not get an upload URL');
      const { uploadUrl } = await presignRes.json();

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      setState('done');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex items-center justify-between rounded-control border border-glass-border bg-white/5 px-4 py-3">
      <div>
        <p className="font-medium">{requirement.label}</p>
        <p className="text-small text-white/60">{requirement.playerName}</p>
      </div>
      <div className="flex items-center gap-3">
        {state === 'done' && <span className="text-small text-neutral">Uploaded — {fileName}</span>}
        {state === 'uploading' && <span className="text-small text-primary">Uploading…</span>}
        {state === 'error' && <span className="text-small text-tertiary">Upload failed — try again</span>}
        <div className="relative">
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <GlassButton type="button" variant="ghost" className="pointer-events-none px-3 py-1.5 text-small">
            {state === 'done' ? 'Replace' : 'Upload'}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
