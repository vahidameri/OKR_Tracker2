'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function FeedbackForm({
  checkInId,
  initialScore,
  initialComment,
}: {
  checkInId: string;
  initialScore: number | null;
  initialComment: string | null;
}) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore?.toString() ?? '');
  const [comment, setComment] = useState(initialComment ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/checkins/${checkInId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: score.trim() === '' ? null : Number(score),
        comment: comment.trim() || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      alert((await res.json()).error ?? 'خطا در ثبت بازخورد');
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">امتیاز (۰ تا ۱۰)</label>
        <Input
          type="number"
          min={0}
          max={10}
          className="h-9 w-20"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
      </div>
      <div className="min-w-56 flex-1">
        <label className="mb-1 block text-xs text-muted-foreground">کامنت</label>
        <Textarea rows={1} className="min-h-9" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? '…' : saved ? 'ثبت شد ✔' : 'ثبت بازخورد'}
      </Button>
    </div>
  );
}
