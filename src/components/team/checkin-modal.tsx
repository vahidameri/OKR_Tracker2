'use client';

import { Check, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { CheckInForm, type CheckInFormProps } from '@/components/team/checkin-form';
import { Modal } from '@/components/ui/modal';

/**
 * دکمهٔ چک‌این هفتگی. اگر این هفته قبلاً ثبت شده باشد، به‌جای یک دکمهٔ همه‌کاره،
 * یک نشانگر «ثبت‌شده» + دکمهٔ جدا «ویرایش/به‌روزرسانی» نشان می‌دهد.
 */
export function CheckinModalButton(
  props: CheckInFormProps & { krTitle: string; objectiveTitle: string }
) {
  const [open, setOpen] = useState(false);
  const { krTitle, objectiveTitle, ...formProps } = props;
  const alreadyDone = !!formProps.existing;

  return (
    <>
      {alreadyDone ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <Check className="h-4 w-4" /> ثبت‌شده
          </span>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> ویرایش / به‌روزرسانی
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> ثبت چک‌این
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={alreadyDone ? 'ویرایش چک‌این این هفته' : 'ثبت چک‌این هفتگی'}
      >
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
