'use client';

import { useState } from 'react';
import { CheckInForm, type CheckInFormProps } from '@/components/team/checkin-form';
import { Modal } from '@/components/ui/modal';

/** دکمه «ثبت چک‌این» که مودال چک‌این هفتگی همان KR را باز می‌کند (مثل مرجع) */
export function CheckinModalButton(
  props: CheckInFormProps & { krTitle: string; objectiveTitle: string }
) {
  const [open, setOpen] = useState(false);
  const { krTitle, objectiveTitle, ...formProps } = props;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
      >
        ثبت چک‌این
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="چک‌این هفتگی">
        <div className="mb-4 rounded-xl bg-muted p-3">
          <p className="font-bold">{krTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{objectiveTitle}</p>
        </div>
        <CheckInForm {...formProps} onSaved={() => setOpen(false)} />
        <p className="mt-4 text-xs text-muted-foreground">تیم و مدیران این به‌روزرسانی را می‌بینند.</p>
      </Modal>
    </>
  );
}
