'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface MilestoneItem {
  id: string;
  title: string;
  isDone: boolean;
}

/**
 * چک‌لیست مایل‌استون‌های سهم تیم از یک KR بله/خیر.
 * تارگت KR خودکار برابر تعداد مایل‌استون‌ها می‌شود و پیشرفت از نسبت انجام‌شده‌ها.
 */
export function MilestoneChecklist({
  teamKeyResultId,
  milestones,
}: {
  teamKeyResultId: string;
  milestones: MilestoneItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(milestones);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const done = items.filter((m) => m.isDone).length;

  async function toggle(m: MilestoneItem) {
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, isDone: !x.isDone } : x)));
    const res = await fetch(`/api/team/milestones/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: !m.isDone }),
    });
    if (!res.ok) {
      setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, isDone: m.isDone } : x)));
    }
    router.refresh();
  }

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/team/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamKeyResultId, title }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? 'خطا در افزودن مایل‌استون');
      return;
    }
    const created = await res.json();
    setItems((prev) => [...prev, { id: created.id, title: created.title, isDone: created.isDone }]);
    setNewTitle('');
    router.refresh();
  }

  async function remove(m: MilestoneItem) {
    if (!confirm(`مایل‌استون «${m.title}» حذف شود؟`)) return;
    setItems((prev) => prev.filter((x) => x.id !== m.id));
    await fetch(`/api/team/milestones/${m.id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">مایل‌استون‌ها (چک‌لیست سهم تیم شما)</p>
        {items.length > 0 && (
          <span className="text-xs font-bold text-muted-foreground">
            {done} از {items.length} انجام شده
          </span>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          هنوز مایل‌استونی تعریف نشده. ریز-وظیفه‌های این KR را اضافه کنید تا تارگت و پیشرفت خودکار محاسبه شود.
        </p>
      )}

      <ul className="space-y-1">
        {items.map((m) => (
          <li key={m.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
            <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={m.isDone} onChange={() => toggle(m)} />
              <span className={m.isDone ? 'text-muted-foreground line-through' : ''}>{m.title}</span>
            </label>
            <button
              onClick={() => remove(m)}
              className="px-1 text-xs text-muted-foreground hover:text-destructive"
              title="حذف مایل‌استون"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Input
          className="h-9"
          placeholder="مایل‌استون جدید…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button size="sm" variant="outline" onClick={add} disabled={busy || !newTitle.trim()}>
          + افزودن
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
