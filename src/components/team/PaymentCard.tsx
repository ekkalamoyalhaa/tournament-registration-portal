'use client';

import {
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Loader2,
  Receipt,
  Upload,
  WalletCards,
} from 'lucide-react';

import {
  getPaymentReceiptUrl,
  submitPaymentReceipt,
} from '@/lib/payment/actions';

import {
  getPaymentReceiptUploadUrl,
} from '@/lib/payment/upload-actions';

type PaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

type PaymentCardProps = {
  registrationId: string;
  paymentStatus: PaymentStatus;
  paymentAmount:
    | string
    | number
    | null
    | undefined;
  paymentDeadline:
    | Date
    | string
    | null
    | undefined;
  paymentReceiptName:
    | string
    | null
    | undefined;
  paymentRejectionReason:
    | string
    | null
    | undefined;
};

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
];

function formatAmount(
  amount:
    | string
    | number
    | null
    | undefined
) {
  if (
    amount === null ||
    amount === undefined ||
    amount === ''
  ) {
    return 'Not configured';
  }

  const value =
    Number(amount);

  if (!Number.isFinite(value)) {
    return 'Not configured';
  }

  return new Intl.NumberFormat(
    'en-MV',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatDeadline(
  value:
    | Date
    | string
    | null
    | undefined
) {
  if (!value) {
    return 'Not configured';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Not configured';
  }

  return new Intl.DateTimeFormat(
    'en-MV',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

function statusText(
  status: PaymentStatus
) {
  switch (status) {
    case 'PENDING':
      return 'Payment required';

    case 'UNDER_REVIEW':
      return 'Under review';

    case 'APPROVED':
      return 'Payment approved';

    case 'REJECTED':
      return 'Payment rejected';

    default:
      return 'Not requested';
  }
}

function statusClass(
  status: PaymentStatus
) {
  switch (status) {
    case 'APPROVED':
      return 'border-green-500/30 bg-green-500/10 text-green-400';

    case 'REJECTED':
      return 'border-tertiary/30 bg-tertiary/10 text-tertiary';

    case 'PENDING':
      return 'border-primary-container/30 bg-primary-container/10 text-primary-container';

    case 'UNDER_REVIEW':
      return 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300';

    default:
      return 'border-white/10 bg-white/[0.04] text-outline';
  }
}

export default function PaymentCard({
  registrationId,
  paymentStatus,
  paymentAmount,
  paymentDeadline,
  paymentReceiptName,
  paymentRejectionReason,
}: PaymentCardProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [uploading, setUploading] =
    useState(false);

  const [openingReceipt, setOpeningReceipt] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  async function handleUpload(
    file: File
  ) {
    setError('');
    setSuccess('');

    if (
      !ACCEPTED_TYPES.includes(
        file.type
      )
    ) {
      setError(
        'Payment receipt must be a PDF, PNG, or JPEG file.'
      );
      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        'Payment receipt cannot exceed 10 MB.'
      );
      return;
    }

    try {
      setUploading(true);

      /*
       * The server generates the storage key.
       * The registration ID is always the active
       * registration ID passed into this component.
       */
      const upload =
        await getPaymentReceiptUploadUrl({
          registrationId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

      const response =
        await fetch(
          upload.uploadUrl,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                file.type,
            },
            body: file,
          }
        );

      if (!response.ok) {
        throw new Error(
          'The receipt could not be uploaded to storage.'
        );
      }

      await submitPaymentReceipt(
        registrationId,
        {
          storageKey:
            upload.storageKey,
          originalFilename:
            file.name,
          mimeType:
            file.type,
          size:
            file.size,
        }
      );

      setSuccess(
        'Payment receipt uploaded successfully and is now under review.'
      );

      /*
       * Refresh the server component so the
       * dashboard immediately reflects the
       * new payment status.
       */
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload payment receipt.'
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    void handleUpload(file);
  }

  async function handleViewReceipt() {
    setError('');
    setSuccess('');

    try {
      setOpeningReceipt(true);

      const url =
        await getPaymentReceiptUrl(
          registrationId
        );

      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open the payment receipt.'
      );
    } finally {
      setOpeningReceipt(false);
    }
  }

  const canUpload =
    paymentStatus ===
      'PENDING' ||
    paymentStatus ===
      'REJECTED';

  const hasReceipt =
    Boolean(
      paymentReceiptName
    );

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
            <WalletCards
              size={19}
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
              Payment status
            </p>

            <h3 className="mt-1 font-sans text-lg font-semibold text-on-surface">
              {statusText(
                paymentStatus
              )}
            </h3>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-wider ${statusClass(
            paymentStatus
          )}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />

          {paymentStatus.replace(
            /_/g,
            ' '
          )}
        </span>
      </div>

      {/* Payment details */}
      {paymentStatus !==
        'NOT_REQUIRED' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/5 bg-black/10 p-4">
            <div className="flex items-center gap-2">
              <Receipt
                size={14}
                className="text-primary-container"
              />

              <p className="font-mono text-[9px] uppercase tracking-wider text-outline">
                Registration Fee Amount
              </p>
            </div>

            <p className="mt-2 font-sans text-xl font-semibold text-on-surface">
              MVR{' '}
              {formatAmount(
                paymentAmount
              )}
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/10 p-4">
            <div className="flex items-center gap-2">
              <CalendarDays
                size={14}
                className="text-primary-container"
              />

              <p className="font-mono text-[9px] uppercase tracking-wider text-outline">
                Payment Deadline
              </p>
            </div>

            <p className="mt-2 font-sans text-sm font-medium text-on-surface">
              {formatDeadline(
                paymentDeadline
              )}
            </p>
          </div>
        </div>
      )}

      {/* Payment required */}
      {paymentStatus ===
        'PENDING' && (
        <div className="mt-4 rounded-lg border border-primary-container/20 bg-primary-container/5 p-4">
          <div className="flex items-start gap-3">
            <Clock3
              size={18}
              className="mt-0.5 shrink-0 text-primary-container"
            />

            <div>
              <p className="font-sans text-sm font-medium text-on-surface">
                Payment is required
              </p>

              <p className="mt-1 font-sans text-xs leading-5 text-on-surface-variant">
                Upload your payment receipt before the payment deadline. The tournament administrator will verify the receipt after submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection */}
      {paymentStatus ===
        'REJECTED' && (
        <div className="mt-4 rounded-lg border border-tertiary/20 bg-tertiary/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-tertiary"
            />

            <div>
              <p className="font-sans text-sm font-medium text-tertiary">
                Payment receipt rejected
              </p>

              {paymentRejectionReason && (
                <p className="mt-1 whitespace-pre-line font-sans text-xs leading-5 text-on-surface-variant">
                  {paymentRejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Under review */}
      {paymentStatus ===
        'UNDER_REVIEW' && (
        <div className="mt-4 rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4">
          <div className="flex items-start gap-3">
            <Clock3
              size={18}
              className="mt-0.5 shrink-0 text-yellow-300"
            />

            <div>
              <p className="font-sans text-sm font-medium text-on-surface">
                Receipt submitted
              </p>

              <p className="mt-1 font-sans text-xs leading-5 text-on-surface-variant">
                Your payment receipt has been submitted and is waiting for tournament administration to verify it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approved */}
      {paymentStatus ===
        'APPROVED' && (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-green-400"
            />

            <div>
              <p className="font-sans text-sm font-medium text-green-400">
                Payment verified
              </p>

              <p className="mt-1 font-sans text-xs leading-5 text-on-surface-variant">
                Your payment has been verified. Final tournament registration approval is handled separately by the tournament administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Receipt */}
      {hasReceipt && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-white/5 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-outline">
              <FileCheck2
                size={16}
              />
            </div>

            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-wider text-outline">
                Receipt
              </p>

              <p className="truncate font-sans text-sm text-on-surface">
                {paymentReceiptName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleViewReceipt
            }
            disabled={
              openingReceipt
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant transition hover:border-primary-container/30 hover:bg-primary-container/5 hover:text-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            {openingReceipt ? (
              <>
                <Loader2
                  size={14}
                  className="animate-spin"
                />
                Opening
              </>
            ) : (
              <>
                <Eye
                  size={14}
                />
                View Receipt
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload */}
      {canUpload && (
        <div className="mt-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={
              handleFileChange
            }
            disabled={uploading}
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-container/30 bg-primary-container/10 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-primary-container transition hover:border-primary-container/50 hover:bg-primary-container/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Uploading receipt
              </>
            ) : (
              <>
                <Upload
                  size={16}
                />
                {paymentStatus ===
                'REJECTED'
                  ? 'Upload New Receipt'
                  : 'Upload Payment Receipt'}
              </>
            )}
          </button>

          <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-wider text-outline">
            PDF, PNG or JPEG · Maximum 10 MB
          </p>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-400/20 bg-red-400/5 p-3">
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0 text-red-300"
          />

          <p className="font-sans text-xs leading-5 text-red-200">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0 text-green-400"
          />

          <p className="font-sans text-xs leading-5 text-green-300">
            {success}
          </p>
        </div>
      )}

      {/* Not requested */}
      {paymentStatus ===
        'NOT_REQUIRED' && (
        <div className="flex min-h-[120px] flex-col items-center justify-center text-center">
          <WalletCards
            size={26}
            className="mb-3 text-outline"
          />

          <p className="font-sans text-sm font-medium text-on-surface">
            Payment has not been requested yet
          </p>

          <p className="mt-1 max-w-sm font-sans text-xs leading-5 text-outline">
            The payment section will become available after the tournament administrator sends this registration to payment.
          </p>
        </div>
      )}
    </div>
  );
}