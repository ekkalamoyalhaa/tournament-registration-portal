'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getRegistrationDocument,
  getRegistrationDocumentUrl,
  saveRegistrationDocument,
} from '@/lib/registration/document-actions';

type DocumentRecord = {
  id: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  createdAt: Date | string;
};

type Props = {
  teamId: string;
  registrationId: string;
  playerId?: string;
  officialRole?: string;
  documentType: string;
  label: string;
  icon?: 'id' | 'photo' | string;
};

function Icon({
  name,
  size = 22,
  strokeWidth = 1.8,
}: {
  name:
    | 'document'
    | 'id'
    | 'photo'
    | 'upload'
    | 'eye'
    | 'close'
    | 'replace'
    | 'check'
    | 'spinner'
    | 'warning';
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'id':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M13 10h5" />
          <path d="M13 14h5" />
        </svg>
      );

    case 'photo':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="m5 17 4.5-4.5 3 3 2-2 4.5 3.5" />
        </svg>
      );

    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      );

    case 'eye':
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case 'close':
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case 'replace':
      return (
        <svg {...common}>
          <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
          <path d="M3 5v5h5" />
          <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
          <path d="M21 19v-5h-5" />
        </svg>
      );

    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case 'spinner':
      return (
        <svg
          {...common}
          className="animate-spin"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            strokeOpacity="0.25"
          />
          <path d="M21 12a9 9 0 0 0-9-9" />
        </svg>
      );

    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 3 2.8 19a1.5 1.5 0 0 0 1.3 2.2h15.8a1.5 1.5 0 0 0 1.3-2.2L12 3Z" />
          <path d="M12 9v4" />
          <circle cx="12" cy="16.5" r=".7" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'document':
    default:
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v5h5" />
          <path d="M8 13h8" />
          <path d="M8 17h6" />
        </svg>
      );
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return '';
  }

  return value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

function isPdf(mimeType: string) {
  return mimeType === 'application/pdf';
}

export function DocumentUploadCard({
  teamId,
  registrationId,
  playerId,
  officialRole,
  documentType,
  label,
  icon,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [document, setDocument] =
    useState<DocumentRecord | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [previewing, setPreviewing] =
    useState(false);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [dragging, setDragging] =
    useState(false);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        await getRegistrationDocument(
          registrationId,
          {
            playerId,
            officialRole,
            documentType,
          }
        );

      setDocument(
        result as DocumentRecord | null
      );
    } catch (err) {
      console.error(
        '[DOCUMENT] Failed to load document:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load document.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocument();
  }, [
    registrationId,
    playerId,
    officialRole,
    documentType,
  ]);

  const uploadFile = async (
    file: File
  ) => {
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        'File is too large. Maximum file size is 10 MB.'
      );
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        'Invalid file type. Please upload JPG, PNG, WEBP, or PDF.'
      );
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const presignResponse =
        await fetch(
          '/api/uploads/presign',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              size: file.size,
              teamId,
              registrationId,
              playerId,
              officialRole,
              documentType,
            }),
          }
        );

      if (!presignResponse.ok) {
        const text =
          await presignResponse.text();

        throw new Error(
          text ||
            'Failed to prepare file upload.'
        );
      }

      const presignData =
        await presignResponse.json();

      const uploadUrl =
        presignData.uploadUrl ??
        presignData.url;

      const storageKey =
        presignData.storageKey ??
        presignData.key;

      if (!uploadUrl || !storageKey) {
        throw new Error(
          'Upload information was not returned by the server.'
        );
      }

      const uploadResponse =
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

      if (!uploadResponse.ok) {
        throw new Error(
          'Failed to upload the file.'
        );
      }

      const saved =
        await saveRegistrationDocument(
          {
            playerId,
            officialRole,
            documentType,
            storageKey,
            originalFilename:
              file.name,
            mimeType: file.type,
            size: file.size,
          },
          registrationId
        );

      if (!saved?.success) {
        throw new Error(
          'The file uploaded but could not be saved.'
        );
      }

      await loadDocument();
    } catch (err) {
      console.error(
        '[DOCUMENT] Upload failed:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload document.'
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      void uploadFile(file);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      void uploadFile(file);
    }
  };

  const handlePreview = async () => {
    if (!document) {
      return;
    }

    try {
      setPreviewing(true);
      setError(null);

      const result =
        await getRegistrationDocumentUrl(
          registrationId,
          document.id
        );

      setPreviewUrl(result.url);
    } catch (err) {
      console.error(
        '[DOCUMENT] Failed to generate preview URL:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open this document.'
      );

      setPreviewing(false);
    }
  };

  const closePreview = () => {
    setPreviewing(false);
    setPreviewUrl(null);
  };

  const iconName =
    icon === 'photo'
      ? 'photo'
      : icon === 'id'
        ? 'id'
        : 'document';

  return (
    <>
      <div
        className="
          rounded-[28px]
          border border-outline-variant/30
          bg-surface-container-low/40
          p-5
          sm:p-6
        "
      >
        {/* Card header */}
        <div className="flex items-start gap-4">
          <div
            className="
              flex h-14 w-14 shrink-0
              items-center justify-center
              rounded-2xl
              border border-[#b98d31]/50
              bg-[#a67b20]/10
              text-[#f4bd4e]
            "
          >
            <Icon
              name={iconName}
              size={26}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-[#c9e5d9]">
                {label}
              </h3>

              {document && (
                <span
                  className="
                    inline-flex items-center gap-1.5
                    text-[16px] font-medium
                    text-[#f5bd4b]
                  "
                >
                  <Icon
                    name="check"
                    size={17}
                    strokeWidth={2.2}
                  />
                  Uploaded
                </span>
              )}
            </div>

            <p className="mt-1 text-[15px] text-[#d0c8bd]">
              JPG, PNG, WEBP or PDF · Max 10 MB
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5">
          {loading ? (
            <div
              className="
                flex h-[92px]
                items-center justify-center
                rounded-2xl
                border border-outline-variant/25
                bg-background/20
                text-on-surface-variant
              "
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  name="spinner"
                  size={20}
                />
                <span className="text-sm">
                  Loading document...
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {document && (
                <div
                  className="
                    flex min-h-[88px]
                    items-center gap-3
                    rounded-2xl
                    border border-outline-variant/25
                    bg-background/25
                    px-3.5 py-3
                  "
                >
                  {/* File icon */}
                  <div
                    className="
                      flex h-12 w-12 shrink-0
                      items-center justify-center
                      rounded-xl
                      bg-primary-container/20
                      text-[#b9e0d0]
                    "
                  >
                    <Icon
                      name={
                        isImage(
                          document.mimeType
                        )
                          ? 'photo'
                          : 'document'
                      }
                      size={23}
                    />
                  </div>

                  {/* File information */}
                  <div className="min-w-0 flex-1">
                    <p
                      title={
                        document.originalFilename
                      }
                      className="
                        truncate
                        text-[15px]
                        font-medium
                        text-[#c9e5d9]
                      "
                    >
                      {document.originalFilename}
                    </p>

                    <p className="mt-1 text-[13px] text-[#b8b0a6]">
                      {formatFileSize(
                        document.size
                      )}
                      {' · '}
                      {formatDate(
                        document.createdAt
                      )}
                    </p>
                  </div>

                  {/* View button */}
                  <button
                    type="button"
                    onClick={() =>
                      void handlePreview()
                    }
                    disabled={previewing}
                    className="
                      inline-flex shrink-0
                      items-center gap-2
                      rounded-xl
                      px-3 py-2
                      text-[14px]
                      font-semibold
                      text-[#f4bd4e]
                      transition
                      hover:bg-[#b98d31]/10
                      disabled:cursor-wait
                      disabled:opacity-60
                    "
                  >
                    <Icon
                      name={
                        previewing
                          ? 'spinner'
                          : 'eye'
                      }
                      size={18}
                    />
                    <span className="hidden sm:inline">
                      View
                    </span>
                  </button>
                </div>
              )}

              {/* Upload / replace area */}
              <button
                type="button"
                onClick={() =>
                  inputRef.current?.click()
                }
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragging(false);
                }}
                onDrop={handleDrop}
                disabled={uploading}
                className={`
                  group
                  flex min-h-[88px]
                  w-full items-center justify-center
                  gap-3
                  rounded-2xl
                  border border-dashed
                  px-5
                  text-center
                  transition-all
                  ${
                    dragging
                      ? 'border-[#f4bd4e] bg-[#b98d31]/10'
                      : 'border-outline-variant/35 bg-background/10 hover:border-[#b98d31]/60 hover:bg-background/20'
                  }
                  ${
                    uploading
                      ? 'cursor-wait opacity-70'
                      : 'cursor-pointer'
                  }
                `}
              >
                <div
                  className="
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-[#b98d31]/10
                    text-[#f4bd4e]
                    transition
                    group-hover:bg-[#b98d31]/15
                  "
                >
                  <Icon
                    name={
                      uploading
                        ? 'spinner'
                        : document
                          ? 'replace'
                          : 'upload'
                    }
                    size={21}
                  />
                </div>

                <div className="text-left">
                  <p className="text-[15px] font-medium text-[#c9e5d9]">
                    {uploading
                      ? 'Uploading...'
                      : document
                        ? 'Replace document'
                        : 'Choose file'}
                  </p>

                  {!uploading && (
                    <p className="text-[13px] text-[#b8b0a6]">
                      or drag & drop
                    </p>
                  )}
                </div>
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={
                  handleFileChange
                }
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="
              mt-4
              flex items-start gap-2.5
              rounded-xl
              border border-red-400/20
              bg-red-400/5
              px-3.5 py-3
              text-sm
              text-red-200
            "
          >
            <Icon
              name="warning"
              size={18}
            />

            <p className="min-w-0 flex-1">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="
                shrink-0
                text-red-200/70
                transition
                hover:text-red-100
              "
              aria-label="Dismiss error"
            >
              <Icon
                name="close"
                size={16}
              />
            </button>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewing && previewUrl && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-black/75
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePreview();
            }
          }}
        >
          <div
            className="
              relative
              flex
              max-h-[92vh]
              w-full max-w-5xl
              flex-col
              overflow-hidden
              rounded-2xl
              border border-outline-variant/40
              bg-[#06251b]
              shadow-2xl
            "
          >
            {/* Modal header */}
            <div
              className="
                flex shrink-0
                items-center justify-between
                gap-4
                border-b border-outline-variant/25
                px-4 py-3
                sm:px-5
              "
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#c9e5d9]">
                  {document?.originalFilename}
                </p>

                <p className="mt-0.5 text-xs text-[#a9b2ab]">
                  {document
                    ? formatFileSize(
                        document.size
                      )
                    : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={closePreview}
                className="
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-lg
                  text-[#c9e5d9]
                  transition
                  hover:bg-white/5
                  hover:text-white
                "
                aria-label="Close preview"
              >
                <Icon
                  name="close"
                  size={21}
                />
              </button>
            </div>

            {/* Preview content */}
            <div
              className="
                min-h-0
                flex-1
                overflow-auto
                bg-black/20
                p-3
                sm:p-5
              "
            >
              {document &&
              isImage(
                document.mimeType
              ) ? (
                <div className="flex min-h-[50vh] items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={
                      document.originalFilename
                    }
                    className="
                      max-h-[76vh]
                      max-w-full
                      rounded-lg
                      object-contain
                      shadow-xl
                    "
                  />
                </div>
              ) : document &&
                isPdf(
                  document.mimeType
                ) ? (
                <iframe
                  src={previewUrl}
                  title={
                    document.originalFilename
                  }
                  className="
                    h-[75vh]
                    w-full
                    rounded-lg
                    bg-white
                  "
                />
              ) : (
                <div className="flex min-h-[50vh] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b98d31]/10 text-[#f4bd4e]">
                      <Icon
                        name="document"
                        size={27}
                      />
                    </div>

                    <p className="mt-4 text-sm text-[#c9e5d9]">
                      Preview is not available
                      for this file type.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DocumentUploadCard;