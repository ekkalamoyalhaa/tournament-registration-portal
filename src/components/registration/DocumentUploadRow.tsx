'use client';

import { useState } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { saveDocumentRecord } from '@/lib/registration/actions';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export interface DocumentRequirement {
  key: string;
  label: string;
  playerId?: string;
  officialRole?: string;
  playerName: string;
  documentType: string;
}

export function DocumentUploadRow({ requirement, teamId }: { requirement: DocumentRequirement; teamId: string }) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleFile(file: File) {
    setState('uploading');
    setFileName(file.name);
    setErrorMsg('');

    try {
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'document',
          teamId,
          playerId: requirement.playerId || undefined,
          officialRole: requirement.officialRole || undefined,
          mimeType: file.type,
          size: file.size,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || `Presign failed (${presignRes.status})`);
      }

      const { uploadUrl, key } = presignData;

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) {
        const putBody = await putRes.text().catch(() => '');
        throw new Error(`Upload to R2 failed (${putRes.status})`);
      }

      await saveDocumentRecord({
        playerId: requirement.playerId,
        officialRole: requirement.officialRole,
        documentType: requirement.documentType,
        storageKey: key,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
      });

      setState('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'Upload failed');
      setState('error');
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <div>
        <p className="font-sans text-body-md font-medium text-on-surface">{requirement.label}</p>
        <p className="font-mono text-label-sm text-outline">{requirement.playerName}</p>
      </div>
      <div className="flex items-center gap-3">
        {state === 'done' && (
          <span className="flex items-center gap-1 font-mono text-label-sm text-green-400">
            <CheckCircle size={14} /> {fileName}
          </span>
        )}
        {state === 'uploading' && (
          <span className="flex items-center gap-1 font-mono text-label-sm text-primary-container">Uploading…</span>
        )}
        {state === 'error' && (
          <span className="flex items-center gap-1 font-mono text-label-sm text-error" title={errorMsg}>
            <AlertCircle size={14} /> Failed
          </span>
        )}
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
          <GlassButton
            type="button"
            variant="ghost"
            className="pointer-events-none px-3 py-1.5 text-label-md flex items-center gap-1"
          >
            <Upload size={14} />
            {state === 'done' ? 'Replace' : 'Upload'}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}