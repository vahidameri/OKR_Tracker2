import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = PrismaClient | Prisma.TransactionClient;

export type AuditEntityType = 'OBJECTIVE' | 'KEY_RESULT' | 'TEAM_KEY_RESULT';

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  OBJECTIVE: 'هدف',
  KEY_RESULT: 'نتیجه کلیدی',
  TEAM_KEY_RESULT: 'سهم تیمی',
};

function fmt(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? 'بله' : 'خیر';
  return String(v);
}

export interface AuditEntry {
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** ثبت یک رویداد در تاریخچه‌ی تغییرات OKR */
export async function logAudit(db: Db, changedById: string | null, entries: AuditEntry[]) {
  if (entries.length === 0) return;
  await db.okrAuditLog.createMany({
    data: entries.map((e) => ({
      entityType: e.entityType,
      entityId: e.entityId,
      entityLabel: e.entityLabel,
      field: e.field,
      oldValue: fmt(e.oldValue),
      newValue: fmt(e.newValue),
      changedById,
    })),
  });
}

/** مقایسه‌ی فیلدهای مشخص بین دو نسخه و ساخت رکوردهای تغییر */
export function diffFields<T extends Record<string, unknown>>(
  base: Omit<AuditEntry, 'field' | 'oldValue' | 'newValue'>,
  before: T,
  after: Partial<T>,
  fields: { key: keyof T & string; label: string }[]
): AuditEntry[] {
  const entries: AuditEntry[] = [];
  for (const f of fields) {
    if (!(f.key in after)) continue;
    const oldV = fmt(before[f.key]);
    const newV = fmt(after[f.key] as unknown);
    if (oldV !== newV) {
      entries.push({ ...base, field: f.label, oldValue: before[f.key], newValue: after[f.key] });
    }
  }
  return entries;
}

export { prisma as auditDb };
