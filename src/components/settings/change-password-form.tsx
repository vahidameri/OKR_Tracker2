'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ChangePasswordForm() {
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPassword !== confirm) {
      setError('تکرار رمز جدید مطابقت ندارد.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'خطا در تغییر رمز عبور');
      return;
    }
    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirm('');
    // به‌روزرسانی توکن نشست تا بنر «تغییر پسورد» محو شود
    await update();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="current">رمز عبور فعلی</Label>
        <Input id="current" type="password" dir="ltr" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="new">رمز عبور جدید (حداقل ۸ کاراکتر)</Label>
        <Input id="new" type="password" dir="ltr" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
      </div>
      <div>
        <Label htmlFor="confirm">تکرار رمز عبور جدید</Label>
        <Input id="confirm" type="password" dir="ltr" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-700">✔ رمز عبور با موفقیت تغییر کرد.</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'در حال ذخیره…' : 'تغییر رمز عبور'}
      </Button>
    </form>
  );
}
