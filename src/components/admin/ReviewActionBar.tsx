'use client';

import { useState } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';

export function ReviewActionBar({
  onApprove,
  onRequestChanges,
  onReject,
}: {
  onApprove: () => void;
  onRequestChanges: (note: string) => void;
  onReject: () => void;
}) {
  const [showNoteField, setShowNoteField] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="glass-panel rounded-xl p-4">
      {showNoteField ? (
        <div className="space-y-3">
          <label className="block font-sans text-body-md font-medium text-on-surface">
            What needs to change?
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30"
              placeholder="e.g. The uploaded passport photo is unclear — please upload a clearer copy."
            />
          </label>
          <div className="flex justify-end gap-3">
            <GlassButton type="button" variant="ghost" onClick={() => setShowNoteField(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              type="button"
              onClick={() => {
                onRequestChanges(note);
                setShowNoteField(false);
                setNote('');
              }}
              disabled={note.trim().length === 0}
            >
              Send change request
            </GlassButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <GlassButton type="button" onClick={onApprove}>
            Approve
          </GlassButton>
          <GlassButton type="button" variant="ghost" onClick={() => setShowNoteField(true)}>
            Request changes
          </GlassButton>
          <button
            type="button"
            onClick={onReject}
            className="rounded-lg border border-error px-5 py-3 font-sans text-body-md font-medium text-error transition-all duration-200 hover:bg-error/10"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}