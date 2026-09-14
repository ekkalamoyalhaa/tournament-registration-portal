'use client';

import { useState, useRef } from 'react';
import {
  Contact,
  User,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { saveDocumentRecord } from '@/lib/registration/actions';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface DocumentUploadCardProps {
  teamId: string;
  registrationId: string;
  officialRole: string;
  documentType: string;
  label: string;
  icon: 'id' | 'photo';
}

export function DocumentUploadCard({
  teamId,
  registrationId,
  officialRole,
  documentType,
  label,
  icon,
}: DocumentUploadCardProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState('uploading');
    setFileName(file.name);
    setErrorMsg('');

    try {
      // 1. Request a presigned upload URL
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'document',
          teamId,
          officialRole,
          mimeType: file.type,
          size: file.size,
        }),
      });

      const presignData = await presignRes.json();

      if (!presignRes.ok) {
        throw new Error(
          presignData.error ||
            `Presign failed (${presignRes.status})`
        );
      }

      const { uploadUrl, key } = presignData;

      if (!uploadUrl || !key) {
        throw new Error(
          'Invalid upload response from server.'
        );
      }

      // 2. Upload directly to R2
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error(
          `Upload to R2 failed (${putRes.status})`
        );
      }

      // 3. Save document metadata against the
      //    exact registration being edited
      await saveDocumentRecord(
        {
          officialRole,
          documentType,
          storageKey: key,
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
        },
        registrationId
      );

      setState('done');
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Upload failed';

      setErrorMsg(message);
      setState('error');
    }
  }

  const Icon = icon === 'id' ? Contact : User;

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 transition-colors ${
        state === 'done'
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-outline-variant/30 hover:border-primary-fixed-dim'
      } glass-panel`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            handleFile(file);
          }

          // Allow the same file to be selected again
          // after an error or replacement.
          e.target.value = '';
        }}
      />

      {state === 'done' ? (
        <CheckCircle
          size={40}
          className="mb-2 text-green-400"
        />
      ) : (
        <Icon
          size={40}
          className="mb-2 text-on-surface-variant transition-colors group-hover:text-primary-fixed-dim"
        />
      )}

      <p className="mb-1 font-label-sm text-label-sm text-on-surface">
        {label}
      </p>

      {state === 'idle' && (
        <p className="text-[10px] text-on-surface-variant">
          Click or drag and drop
        </p>
      )}

      {state === 'uploading' && (
        <p className="text-[10px] text-primary-container">
          Uploading…
        </p>
      )}

      {state === 'done' && fileName && (
        <p className="text-[10px] text-green-400">
          {fileName}
        </p>
      )}

      {state === 'error' && (
        <p
          className="flex items-center gap-1 text-[10px] text-error"
          title={errorMsg}
        >
          <AlertCircle size={10} />
          Failed
        </p>
      )}
    </div>
  );
}