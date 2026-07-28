'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { formatJalaliDateTime } from '@/lib/jalali';

interface TeamRow {
  id: string;
  name: string;
}

interface UserRow {
  id: string;
  username: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_MEMBER';
  isActive: boolean;
  teams: { team: { id: string; name: string } }[];
  _count: { sessions: number };
}

interface SessionRow {
  id: string;
  loginAt: string;
  logoutAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'TEAM_MEMBER' as 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_MEMBER',
    teamIds: [] as string[],
  });
  const [error, setError] = useState('');
  const [sessionsFor, setSessionsFor] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const load = useCallback(async () => {
    const [uRes, tRes] = await Promise.all([fetch('/api/admin/users'), fetch('/api/admin/teams')]);
    setUsers(await uRes.json());
    setTeams((await tRes.json()).map((t: TeamRow) => ({ id: t.id, name: t.name })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser() {
    setError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? 'خطا در ایجاد کاربر');
      return;
    }
    setShowCreate(false);
    setForm({ username: '', fullName: '', password: '', role: 'TEAM_MEMBER', teamIds: [] });
    await load();
  }

  async function toggleActive(user: UserRow) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (!res.ok) alert((await res.json()).error ?? 'خطا');
    await load();
  }

  async function resetPassword(user: UserRow) {
    const password = prompt(`رمز عبور موقت جدید برای «${user.fullName}» (حداقل ۸ کاراکتر):`);
    if (!password) return;
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) alert((await res.json()).error ?? 'خطا');
    else alert('رمز موقت ثبت شد؛ کاربر در اولین ورود باید آن را تغییر دهد.');
  }

  async function showSessions(userId: string) {
    if (sessionsFor === userId) {
      setSessionsFor(null);
      return;
    }
    const res = await fetch(`/api/admin/users/${userId}/sessions`);
    setSessions(await res.json());
    setSessionsFor(userId);
  }

  function toggleTeam(teamId: string) {
    setForm((f) => ({
      ...f,
      teamIds: f.teamIds.includes(teamId) ? f.teamIds.filter((t) => t !== teamId) : [...f.teamIds, teamId],
    }));
  }

  if (loading) return <p className="py-10 text-center text-muted-foreground">در حال بارگذاری…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black">مدیریت کاربران</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'بستن فرم' : '+ کاربر جدید'}</Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>ایجاد کاربر جدید</CardTitle>
            <CardDescription>کاربر در اولین ورود مجبور به تغییر رمز موقت است.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>نام کاربری (لاتین)</Label>
                <Input dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <Label>نام و نام خانوادگی</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <Label>رمز عبور موقت (حداقل ۸ کاراکتر)</Label>
                <Input dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <Label>نقش</Label>
                <Select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_MEMBER' })
                  }
                >
                  <option value="TEAM_MEMBER">عضو تیم</option>
                  <option value="ADMIN">ادمین (مدیریت)</option>
                  <option value="SUPER_ADMIN">سوپر ادمین (دسترسی کامل)</option>
                </Select>
              </div>
            </div>
            {form.role === 'TEAM_MEMBER' && (
              <div>
                <Label>تیم(ها) — یک کاربر می‌تواند عضو چند تیم باشد</Label>
                <div className="flex flex-wrap gap-3">
                  {teams.map((t) => (
                    <label key={t.id} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={form.teamIds.includes(t.id)}
                        onChange={() => toggleTeam(t.id)}
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={createUser}>ایجاد کاربر</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <Table>
            <THead>
              <TR>
                <TH>نام</TH>
                <TH>نام کاربری</TH>
                <TH>نقش</TH>
                <TH>تیم‌ها</TH>
                <TH>وضعیت</TH>
                <TH>عملیات</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((u) => (
                <Fragment key={u.id}>
                  <TR>
                    <TD className="font-medium">{u.fullName}</TD>
                    <TD dir="ltr" className="text-left font-mono text-xs">
                      {u.username}
                    </TD>
                    <TD>
                      {u.role === 'SUPER_ADMIN' ? (
                        <Badge className="bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/30">سوپر ادمین</Badge>
                      ) : u.role === 'ADMIN' ? (
                        <Badge className="bg-violet-100 text-violet-800">ادمین</Badge>
                      ) : (
                        <Badge className="bg-muted text-foreground">عضو تیم</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {u.teams.map((t) => (
                          <Badge key={t.team.id} className="bg-blue-50 text-blue-800">
                            {t.team.name}
                          </Badge>
                        ))}
                      </div>
                    </TD>
                    <TD>
                      {u.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-800">فعال</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">غیرفعال</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => showSessions(u.id)}>
                          نشست‌ها ({u._count.sessions})
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => resetPassword(u)}>
                          تغییر رمز
                        </Button>
                        <Button
                          size="sm"
                          variant={u.isActive ? 'destructive' : 'success'}
                          onClick={() => toggleActive(u)}
                        >
                          {u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </Button>
                      </div>
                    </TD>
                  </TR>
                  {sessionsFor === u.id && (
                    <TR>
                      <TD colSpan={6} className="bg-muted/40">
                        {sessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">نشستی ثبت نشده است.</p>
                        ) : (
                          <Table>
                            <THead>
                              <TR>
                                <TH>ورود</TH>
                                <TH>خروج</TH>
                                <TH>IP</TH>
                                <TH>مرورگر</TH>
                              </TR>
                            </THead>
                            <TBody>
                              {sessions.map((s) => (
                                <TR key={s.id}>
                                  <TD className="text-xs">{formatJalaliDateTime(s.loginAt)}</TD>
                                  <TD className="text-xs">
                                    {s.logoutAt ? formatJalaliDateTime(s.logoutAt) : 'باز / نامشخص'}
                                  </TD>
                                  <TD dir="ltr" className="text-left font-mono text-xs">
                                    {s.ipAddress ?? '—'}
                                  </TD>
                                  <TD className="max-w-sm truncate text-xs" dir="ltr">
                                    {s.userAgent ?? '—'}
                                  </TD>
                                </TR>
                              ))}
                            </TBody>
                          </Table>
                        )}
                      </TD>
                    </TR>
                  )}
                </Fragment>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
