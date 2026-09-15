'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Save,
} from 'lucide-react';

import {
  getTournamentPaymentSettings,
  updateTournamentPaymentSettings,
} from '@/lib/admin/actions';

function formatDateTimeLocal(isoDate: string | null) {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function TournamentPaymentSettings() {
  const [tournamentName, setTournamentName] = useState('');
  const [registrationFeeAmount, setRegistrationFeeAmount] = useState('');
  const [paymentDeadline, setPaymentDeadline] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setError('');

        const settings = await getTournamentPaymentSettings();

        if (!mounted) {
          return;
        }

        setTournamentName(settings.name);
        setRegistrationFeeAmount(
          settings.registrationFeeAmount
        );
        setPaymentDeadline(
          formatDateTimeLocal(
            settings.paymentDeadline
          )
        );
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load payment settings.'
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const amount =
      registrationFeeAmount.trim();

    if (!amount) {
      setError(
        'Registration fee amount is required.'
      );
      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        'Enter a valid registration fee greater than MVR 0.'
      );
      return;
    }

    if (!paymentDeadline) {
      setError(
        'Payment deadline is required.'
      );
      return;
    }

    const deadline =
      new Date(paymentDeadline);

    if (
      Number.isNaN(
        deadline.getTime()
      )
    ) {
      setError(
        'Enter a valid payment deadline.'
      );
      return;
    }

    if (
      deadline.getTime() <=
      Date.now()
    ) {
      setError(
        'Payment deadline must be in the future.'
      );
      return;
    }

    try {
      setSaving(true);

      const result =
        await updateTournamentPaymentSettings(
          amount,
          deadline.toISOString()
        );

      setTournamentName(
        result.tournament.name
      );

      setRegistrationFeeAmount(
        result.tournament
          .registrationFeeAmount
      );

      setPaymentDeadline(
        formatDateTimeLocal(
          result.tournament
            .paymentDeadline
        )
      );

      setSuccess(
        'Payment settings saved successfully.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save payment settings.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-panel overflow-hidden rounded-xl">
      <div className="border-b border-primary-container/15 px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-container/20 bg-primary-container/10">
                <CircleDollarSign
                  size={20}
                  className="text-primary-container"
                />
              </div>

              <div>
                <h3 className="font-mono text-label-md uppercase tracking-wider text-outline">
                  Payment configuration
                </h3>

                {tournamentName && (
                  <p className="mt-1 font-sans text-body-sm text-outline/70">
                    {tournamentName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <span className="font-mono text-label-sm uppercase tracking-wider text-primary-container/70">
            Tournament settings
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6"
      >
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <div className="flex items-center gap-3 font-mono text-label-sm uppercase tracking-wider text-outline">
              <Loader2
                size={18}
                className="animate-spin text-primary-container"
              />
              Loading payment settings
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Registration Fee */}
              <div>
                <label
                  htmlFor="registration-fee-amount"
                  className="mb-2 block font-mono text-label-sm uppercase tracking-wider text-outline"
                >
                  Registration fee
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="font-mono text-label-md text-primary-container">
                      MVR
                    </span>
                  </div>

                  <input
                    id="registration-fee-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={
                      registrationFeeAmount
                    }
                    onChange={(event) => {
                      setRegistrationFeeAmount(
                        event.target.value
                      );
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="0.00"
                    disabled={saving}
                    className="w-full rounded-lg border border-outline/20 bg-black/20 py-3 pl-16 pr-4 font-mono text-body-md text-white outline-none transition-all placeholder:text-outline/40 focus:border-primary-container/60 focus:ring-1 focus:ring-primary-container/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <p className="mt-2 font-sans text-body-sm text-outline/60">
                  This amount will be applied to registrations when they are sent to payment.
                </p>
              </div>

              {/* Payment Deadline */}
              <div>
                <label
                  htmlFor="payment-deadline"
                  className="mb-2 block font-mono text-label-sm uppercase tracking-wider text-outline"
                >
                  Payment deadline
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <CalendarDays
                      size={18}
                      className="text-primary-container"
                    />
                  </div>

                  <input
                    id="payment-deadline"
                    type="datetime-local"
                    value={
                      paymentDeadline
                    }
                    onChange={(event) => {
                      setPaymentDeadline(
                        event.target.value
                      );
                      setError('');
                      setSuccess('');
                    }}
                    disabled={saving}
                    className="w-full rounded-lg border border-outline/20 bg-black/20 py-3 pl-12 pr-4 font-mono text-body-md text-white outline-none transition-all focus:border-primary-container/60 focus:ring-1 focus:ring-primary-container/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <p className="mt-2 font-sans text-body-sm text-outline/60">
                  Teams sent to payment will receive this deadline.
                </p>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />

                <p className="font-sans text-body-sm text-red-200">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary-container/20 bg-primary-container/5 px-4 py-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-primary-container"
                />

                <p className="font-sans text-body-sm text-primary-container">
                  {success}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 border-t border-primary-container/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-sans text-body-sm text-outline/50">
                Changes apply to teams when an administrator sends their registration to payment.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary-container/30 bg-primary-container/10 px-5 font-mono text-label-sm uppercase tracking-wider text-primary-container transition-all hover:border-primary-container/50 hover:bg-primary-container/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save payment settings
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}