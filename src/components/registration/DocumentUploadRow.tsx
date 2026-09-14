
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';

import {
  getRegistrationDocument,
  getRegistrationDocumentUrl,
  saveRegistrationDocument,
} from '@/lib/registration/document-actions';

interface DocumentUploadRowProps {
  teamId: string;
  registrationId: string;
  officialRole?: string;
  playerId?: string;
  documentType: string;
  label: string;
  description?: string;
  accept?: string;
  onUploaded?: () => void;
}

interface RegistrationDocument {
  id: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  createdAt?: Date | string;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
}

export function DocumentUploadRow({
  teamId,
  registrationId,
  officialRole,
  playerId,
  documentType,
  label,
  description,
  accept = 'image/*,.pdf',
  onUploaded,
}: DocumentUploadRowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [document, setDocument] =
    useState<RegistrationDocument | null>(null);

  const [status, setStatus] = useState<
    'loading' | 'idle' | 'uploading' | 'success' | 'error'
  >('loading');

  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const loadDocument = useCallback(async () => {
    try {
      setStatus('loading');
      setError('');

      const result = await getRegistrationDocument(registrationId, {
        playerId,
        officialRole,
        documentType,
      });

      if (result) {
        setDocument(result);
        setFileName(result.originalFilename);
        setStatus('success');
      } else {
        setDocument(null);
        setFileName('');
        setStatus('idle');
      }
    } catch (err) {
      console.error('Failed to load document:', err);

      setDocument(null);
      setFileName('');
      setStatus('idle');
    }
  }, [registrationId, playerId, officialRole, documentType]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  const openDocument = async () => {
    if (!document) return;

    try {
      setError('');

      const result = await getRegistrationDocumentUrl(
        document.id,
        registrationId,
      );

      if (!result?.url) {
        throw new Error('Unable to create document URL.');
      }

      window.open(
        result.url,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (err) {
      console.error('Failed to open document:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open this document. Please try again.',
      );
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    try {
      setStatus('uploading');
      setError('');
      setFileName(file.name);

      const presignResponse = await fetch(
        '/api/uploads/presign',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kind: 'document',
            teamId,
            playerId: playerId || undefined,
            officialRole: officialRole || undefined,
            mimeType: file.type,
            size: file.size,
          }),
        },
      );

      if (!presignResponse.ok) {
        const data = await presignResponse
          .json()
          .catch(() => null);

        throw new Error(
          data?.error ||
            'Unable to prepare the document upload.',
        );
      }

      const presignData = await presignResponse.json();

      const uploadResponse = await fetch(
        presignData.uploadUrl,
        {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error(
          'The document could not be uploaded.',
        );
      }

      const result = await saveRegistrationDocument(
        {
          playerId,
          officialRole,
          documentType,
          storageKey: presignData.storageKey,
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
        },
        registrationId,
      );

      if (!result?.success || !result.document) {
        throw new Error(
          'The uploaded document could not be saved.',
        );
      }

      setDocument(result.document);
      setFileName(result.document.originalFilename);
      setStatus('success');

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      onUploaded?.();
    } catch (err) {
      console.error('Document upload failed:', err);

      setStatus(document ? 'success' : 'error');

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while uploading the document.',
      );
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      void uploadFile(file);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadFile(file);
    }
  };

  return (
    <div className="rounded-xl border border-outline/30 bg-surface-container-low/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />

            <h4 className="text-sm font-semibold text-on-surface">
              {label}
            </h4>

            {document && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <CheckCircle2 className="h-3 w-3" />
                Uploaded
              </span>
            )}
          </div>

          {description && (
            <p className="mt-1 text-xs text-on-surface-variant">
              {description}
            </p>
          )}
        </div>

        {document && (
          <button
            type="button"
            onClick={() => void openDocument()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline/40 bg-surface-container-high/60 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/50 hover:text-primary"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
        )}
      </div>

      <div className="mt-3">
        {status === 'loading' ? (
          <div className="flex items-center gap-2 rounded-lg border border-outline/20 bg-surface-container/40 px-3 py-3 text-xs text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking uploaded document...
          </div>
        ) : document ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-on-surface">
                  {document.originalFilename}
                </p>

                <p className="mt-0.5 text-[11px] text-on-surface-variant">
                  {document.mimeType || 'Document'} ·{' '}
                  {formatBytes(document.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={status === 'uploading'}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline/40 bg-surface-container-high/60 px-3 py-2 text-xs font-medium text-on-surface transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </button>
          </div>
        ) : (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={[
              'rounded-lg border border-dashed px-4 py-4 transition',
              dragging
                ? 'border-primary bg-primary/10'
                : 'border-outline/40 bg-surface-container/30 hover:border-primary/40',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
                  <UploadCloud className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-on-surface">
                    Drop a file here
                  </p>

                  <p className="text-[11px] text-on-surface-variant">
                    or select a file from your device
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary transition hover:opacity-90"
              >
                Choose file
              </button>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        {status === 'uploading' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading {fileName}...
          </div>
        )}

        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentUploadRow;
