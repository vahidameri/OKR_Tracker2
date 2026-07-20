'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface TaskItem {
  id: string;
  title: string;
  isDone: boolean;
}

/**
 * چک‌لیست تسک‌های سهم تیم از یک KR بله/خیر. مسئول تیم تسک اضافه/حذف می‌کند و
 * تیک می‌زند؛ پیشرفت KR از نسبت تسک‌های انجام‌شده محاسبه می‌شود.
 */
export function TaskChecklist({
  teamKeyResultId,
  tasks,
  onChange,
}: {
  teamKeyResultId: string;
  tasks: TaskItem[];
  onChange?: (tasks: TaskItem[]) => void;
}) {
  const [items, setItems] = useState<TaskItem[]>(tasks);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const done = items.filter((t) => t.isDone).length;

  function propagate(next: TaskItem[]) {
    setItems(next);
    onChange?.(next);
  }

  async function toggle(t: TaskItem) {
    const next = items.map((x) => (x.id === t.id ? { ...x, isDone: !x.isDone } : x));
    propagate(next);
    const res = await fetch(`/api/team/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: !t.isDone }),
    });
    if (!res.ok) propagate(items);
  }

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/team/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamKeyResultId, title }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error ?? 'خطا در افزودن تسک');
    const created = await res.json();
    propagate([...items, { id: created.id, title: created.title, isDone: created.isDone }]);
    setNewTitle('');
  }

  async function remove(t: TaskItem) {
    if (!confirm(`تسک «${t.title}» حذف شود؟`)) return;
    propagate(items.filter((x) => x.id !== t.id));
    await fetch(`/api/team/tasks/${t.id}`, { method: 'DELETE' });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">تسک‌ها (چک‌لیست سهم تیم شما)</p>
        {items.length > 0 && (
          <span className="text-xs font-bold text-muted-foreground">
            {done} از {items.length} انجام شده
          </span>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          می‌توانید ریز-کارهای این KR را به‌صورت تسک اضافه کنید تا پیشرفت خودکار محاسبه شود (اختیاری).
        </p>
      )}

      <ul className="space-y-1">
        {items.map((t) => (
          <li key={t.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
            <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={t.isDone} onChange={() => toggle(t)} />
              <span className={t.isDone ? 'text-muted-foreground line-through' : ''}>{t.title}</span>
            </label>
            <button onClick={() => remove(t)} className="px-1 text-xs text-muted-foreground hover:text-destructive">
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Input
          className="h-9"
          placeholder="تسک جدید…"
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
