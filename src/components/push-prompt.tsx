'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(Array.from(rawData, (c) => c.charCodeAt(0)));
}

type State = 'loading' | 'unsupported' | 'insecure' | 'denied' | 'off' | 'on' | 'busy';

export function PushPrompt() {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;
      if (!window.isSecureContext) return setState('insecure');
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return setState('unsupported');
      if (Notification.permission === 'denied') return setState('denied');
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? 'on' : 'off');
    })();
  }, []);

  async function enable() {
    setState('busy');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState('denied');
      const reg = await navigator.serviceWorker.register('/sw.js');
      const { publicKey } = await (await fetch('/api/push/public-key')).json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setState(res.ok ? 'on' : 'off');
    } catch {
      setState('off');
    }
  }

  async function disable() {
    setState('busy');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } finally {
      setState('off');
    }
  }

  if (state === 'loading') return null;

  if (state === 'insecure') {
    return (
      <p className="text-sm text-muted-foreground">
        ⚠ نوتیفیکیشن مرورگر فقط روی HTTPS (یا localhost) فعال می‌شود. روی سرور داخلی، آدرس را HTTPS کنید.
      </p>
    );
  }
  if (state === 'unsupported') {
    return <p className="text-sm text-muted-foreground">مرورگر شما از پوش نوتیفیکیشن پشتیبانی نمی‌کند.</p>;
  }
  if (state === 'denied') {
    return (
      <p className="text-sm text-muted-foreground">
        اجازه‌ی نوتیفیکیشن در مرورگر رد شده است؛ از تنظیمات سایت در مرورگر دوباره فعالش کنید.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm">
        {state === 'on'
          ? '🔔 یادآوری چک‌این فعال است (شنبه تا یک‌شنبه، ساعت ۱۰ صبح)'
          : 'با فعال‌سازی، شنبه تا یک‌شنبه اگر چک‌این هفته ثبت نشده باشد یادآوری می‌گیرید.'}
      </p>
      {state === 'on' ? (
        <Button size="sm" variant="outline" onClick={disable} disabled={false}>
          غیرفعال‌سازی
        </Button>
      ) : (
        <Button size="sm" onClick={enable} disabled={state === 'busy'}>
          {state === 'busy' ? 'در حال فعال‌سازی…' : 'فعال‌سازی یادآوری'}
        </Button>
      )}
    </div>
  );
}
