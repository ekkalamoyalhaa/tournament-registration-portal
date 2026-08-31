'use client';

import { useState } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';

// PRD §23/§24 — the three review actions available to admins on a team or a
// player. "Request changes" opens a note field since a change request needs
// to say what's wrong (PRD §25).
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
    <div className="rounded-control border border-glass-border bg-white/5 p-4">
      {showNoteField ? (
        <div className="space-y-3">
          <label className="block text-small font-medium text-white/85">
            What needs to change?
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-control border border-glass-border bg-white/5 px-4 py-3 text-body text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
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
            className="rounded-control border-[1.5px] border-tertiary px-5 py-3 font-semibold text-tertiary transition-all duration-200 hover:bg-tertiary/10"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
