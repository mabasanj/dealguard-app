'use client';

import React, { useMemo, useState } from 'react';
import { disputeApi } from '@/lib/api-services/dispute';

type DisputeReason =
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_NOT_AS_DESCRIBED'
  | 'QUALITY_ISSUES'
  | 'LATE_DELIVERY'
  | 'OTHER';

type WizardStep = 'reason' | 'description' | 'evidence';

export type EvidenceWizardResult = {
  dispute: any;
};

interface EvidenceWizardProps {
  escrowId: string;
  onClose: () => void;
  onResolved: (result: EvidenceWizardResult) => void;
}

export default function EvidenceWizard({
  escrowId,
  onClose,
  onResolved,
}: EvidenceWizardProps) {
  const [step, setStep] = useState<WizardStep>('reason');

  const [reason, setReason] = useState<DisputeReason>('OTHER');
  const [description, setDescription] = useState('');
  const [unboxingUrl, setUnboxingUrl] = useState('');
  const [courierReceiptUrl, setCourierReceiptUrl] = useState('');
  const [extraUrls, setExtraUrls] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const allowedReasons = useMemo(
    () =>
      [
        'ITEM_NOT_RECEIVED',
        'ITEM_NOT_AS_DESCRIBED',
        'QUALITY_ISSUES',
        'LATE_DELIVERY',
        'OTHER',
      ] as DisputeReason[],
    []
  );

  const evidenceUrls = useMemo(() => {
    const extra = extraUrls
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return [unboxingUrl.trim(), courierReceiptUrl.trim(), ...extra].filter(Boolean);
  }, [unboxingUrl, courierReceiptUrl, extraUrls]);

  const canContinueFromReason = Boolean(reason);
  const canContinueFromDescription = description.trim().length >= 5;
  const canSubmit = evidenceUrls.length >= 2 && description.trim().length >= 5;

  const next = () => {
    if (step === 'reason' && !canContinueFromReason) return;
    if (step === 'description' && !canContinueFromDescription) return;

    setError('');
    setStep((prev) => {
      if (prev === 'reason') return 'description';
      if (prev === 'description') return 'evidence';
      return prev;
    });
  };

  const back = () => {
    setError('');
    setStep((prev) => {
      if (prev === 'evidence') return 'description';
      if (prev === 'description') return 'reason';
      return prev;
    });
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      setError('');

      if (!canSubmit) {
        setError('Please provide the required evidence and description.');
        return;
      }

      const result = await disputeApi.create(
        escrowId,
        reason,
        description.trim(),
        evidenceUrls
      );

      onResolved({ dispute: result.dispute ?? result });
    } catch (e: any) {
      setError(e?.error || e?.message || 'Failed to open dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-lg border-danger/30 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Report an issue</h2>
          <p className="text-sm text-gray-600 mt-1">
            Evidence-only disputes (no text-only claims).
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm btn px-3 py-2"
          onClick={onClose}
          disabled={submitting}
        >
          Close
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold border ${
              step === 'reason'
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            1. Reason
          </span>
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold border ${
              step === 'description'
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            2. Describe
          </span>
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold border ${
              step === 'evidence'
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            3. Evidence
          </span>
        </div>

        {step === 'reason' && (
          <div className="space-y-2">
            <label className="input-label" htmlFor="dispute-reason">Dispute reason</label>
            <select
              id="dispute-reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              disabled={submitting}
            >
              {allowedReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="text-xs text-gray-500">
              This helps SafeZAR route your dispute correctly.
            </div>
          </div>
        )}

        {step === 'description' && (
          <div className="space-y-2">
            <label className="input-label">What went wrong?</label>
            <textarea
              className="input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: The package arrived damaged, and the item inside was not the same as described."
              disabled={submitting}
            />
            <div className="text-xs text-gray-500">
              Provide at least 5 characters.
            </div>
          </div>
        )}

        {step === 'evidence' && (
          <div className="space-y-3">
            <div>
              <label className="input-label">Unboxing / defect evidence (URL)</label>
              <input
                className="input"
                value={unboxingUrl}
                onChange={(e) => setUnboxingUrl(e.target.value)}
                placeholder="https://... (photo or video link)"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="input-label">Courier receipt / waybill (URL)</label>
              <input
                className="input"
                value={courierReceiptUrl}
                onChange={(e) => setCourierReceiptUrl(e.target.value)}
                placeholder="https://... (photo link)"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="input-label">
                Extra evidence (optional, comma-separated URLs)
              </label>
              <input
                className="input"
                value={extraUrls}
                onChange={(e) => setExtraUrls(e.target.value)}
                placeholder="https://..., https://..."
                disabled={submitting}
              />
            </div>

            <div className="text-xs text-gray-500">
              You must submit at least two evidence URLs.
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            {step !== 'reason' && (
              <button
                type="button"
                className="btn-secondary btn-sm btn"
                onClick={back}
                disabled={submitting}
              >
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {step === 'evidence' ? (
              <button
                type="button"
                className="btn-primary btn-sm btn"
                onClick={submit}
                disabled={submitting || !canSubmit}
              >
                {submitting ? 'Opening...' : 'Open dispute'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary btn-sm btn"
                onClick={next}
                disabled={submitting || (step === 'reason' ? !canContinueFromReason : !canContinueFromDescription)}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
