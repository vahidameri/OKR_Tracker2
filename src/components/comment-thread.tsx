'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatJalaliDateTime } from '@/lib/jalali';
import { cn } from '@/lib/utils';

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorRole: 'ADMIN' | 'TEAM_MEMBER' | null;
}

/** گفتگوی روی چک‌این: ثبت‌کننده و مدیر می‌توانند رفت‌وبرگشتی کامنت بگذارند */
export function CommentThread({
  checkInId,
  comments,
}: {
  checkInId: string;
  comments: CommentItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(comments.length > 0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/checkins/${checkInId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? 'خطا در ثبت کامنت');
      return;
    }
    setText('');
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-primary"
      >
        💬 افزودن کامنت
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
      <p className="text-xs font-bold text-muted-foreground">💬 گفتگو ({comments.length})</p>
      {comments.map((c) => (
        <div
          key={c.id}
          className={cn(
            'rounded-md p-2 text-xs',
            c.authorRole === 'ADMIN' ? 'bg-blue-50 text-blue-900' : 'bg-card'
          )}
        >
          <p className="mb-0.5 flex flex-wrap items-center gap-2 font-bold">
            {c.authorName ?? '—'}
            {c.authorRole === 'ADMIN' && (
              <span className="rounded-full bg-blue-200 px-1.5 text-[10px]">مدیر</span>
            )}
            <span className="font-normal text-muted-foreground">{formatJalaliDateTime(c.createdAt)}</span>
          </p>
          <p className="whitespace-pre-wrap">{c.body}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          className="h-9 text-xs"
          placeholder="کامنت بنویسید…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button size="sm" onClick={send} disabled={busy || !text.trim()}>
          {busy ? '…' : 'ارسال'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
