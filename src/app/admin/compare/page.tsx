import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { getDepartmentOverview, tkrProgress } from '@/lib/okr-data';
import { parsePeriod } from '@/lib/period';
import { weightedProgress } from '@/lib/progress';

export const dynamic = 'force-dynamic';

function cellStyle(progress: number | null) {
  if (progress === null) return { background: '#f0efec', color: '#898781' };
  if (progress >= 75) return { background: '#256abf', color: '#fff' };
  if (progress >= 50) return { background: '#6da7ec', color: '#0b0b0b' };
  if (progress >= 25) return { background: '#9ec5f4', color: '#0b0b0b' };
  return { background: '#cde2fb', color: '#0b0b0b' };
}

/** مقایسه‌ی عملکرد تیم‌ها بین دوره‌های متوالی OKR */
export default async function ComparePage() {
  const { teams, tkrs } = await getDepartmentOverview();

  const periods = Array.from(new Set(tkrs.map((t) => t.keyResult.objective.period))).sort((a, b) => {
    const pa = parsePeriod(a);
    const pb = parsePeriod(b);
    if (pa && pb) return pa.start.getTime() - pb.start.getTime();
    return a.localeCompare(b, 'fa');
  });

  const cell = (teamId: string | null, period: string): { progress: number | null; count: number } => {
    const subset = tkrs.filter(
      (t) => t.keyResult.objective.period === period && (teamId === null || t.teamId === teamId)
    );
    if (subset.length === 0) return { progress: null, count: 0 };
    return {
      progress: weightedProgress(subset.map((t) => ({ weight: t.weight, progress: tkrProgress(t) }))),
      count: subset.length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black">مقایسه‌ی دوره‌به‌دوره</h1>
        <p className="text-sm text-muted-foreground">
          پیشرفت وزنی نهایی هر تیم در هر دوره‌ی OKR — برای دیدن روند بهبود/افت بین فصل‌ها.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          {periods.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">هنوز OKRی تعریف نشده است.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>تیم</TH>
                  {periods.map((p) => (
                    <TH key={p} className="text-center">
                      {p}
                    </TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {teams.map((team) => (
                  <TR key={team.id}>
                    <TD className="font-medium">{team.name}</TD>
                    {periods.map((p) => {
                      const c = cell(team.id, p);
                      return (
                        <TD key={p} className="p-1 text-center">
                          <span
                            className="inline-block w-full rounded-md px-2 py-2 text-xs font-bold tabular-nums"
                            style={cellStyle(c.progress)}
                            title={c.progress === null ? 'بدون KR در این دوره' : `${c.count} رکورد KR-تیم`}
                          >
                            {c.progress === null ? '—' : `${c.progress}٪`}
                          </span>
                        </TD>
                      );
                    })}
                  </TR>
                ))}
                <TR className="border-t-2 border-border">
                  <TD className="font-black">کل دپارتمان</TD>
                  {periods.map((p) => {
                    const c = cell(null, p);
                    return (
                      <TD key={p} className="p-1 text-center">
                        <span
                          className="inline-block w-full rounded-md px-2 py-2 text-xs font-black tabular-nums"
                          style={cellStyle(c.progress)}
                        >
                          {c.progress === null ? '—' : `${c.progress}٪`}
                        </span>
                      </TD>
                    );
                  })}
                </TR>
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">نکته</CardTitle>
          <CardDescription>
            عدد هر خانه، آخرین وضعیت ثبت‌شده‌ی آن دوره است؛ برای دوره‌های تمام‌شده یعنی کارنامه‌ی نهایی همان
            دوره. رنگ تیره‌تر = پیشرفت بیشتر.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
