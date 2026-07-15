import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TeamSwitcher({
  teams,
  activeTeamId,
  basePath,
}: {
  teams: { id: string; name: string }[];
  activeTeamId: string;
  basePath: string;
}) {
  if (teams.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">تیم:</span>
      {teams.map((t) => (
        <Link
          key={t.id}
          href={`${basePath}?team=${t.id}`}
          className={cn(
            'rounded-full px-3 py-1 text-sm',
            t.id === activeTeamId
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card hover:bg-muted'
          )}
        >
          {t.name}
        </Link>
      ))}
    </div>
  );
}
