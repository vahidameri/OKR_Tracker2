import { z } from 'zod';

export const metricTypeEnum = z.enum(['NUMERIC', 'BOOLEAN', 'TEXT']);
export const progressStatusEnum = z.enum(['ON_TRACK', 'AT_RISK', 'BLOCKED', 'COMPLETED']);
export const roleEnum = z.enum(['ADMIN', 'TEAM_MEMBER']);

export const teamAssignmentSchema = z.object({
  teamId: z.string().min(1),
  weight: z.coerce.number().positive('وزن باید مثبت باشد'),
  targetValueOverride: z.coerce.number().nullable().optional(),
  minValueOverride: z.coerce.number().nullable().optional(),
});

export const keyResultSchema = z
  .object({
    title: z.string().min(2, 'عنوان نتیجه کلیدی الزامی است'),
    weight: z.coerce.number().positive('وزن باید مثبت باشد'),
    metricType: metricTypeEnum,
    minValue: z.coerce.number().nullable().optional(),
    targetValue: z.coerce.number().nullable().optional(),
    unit: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    teams: z.array(teamAssignmentSchema).min(1, 'حداقل یک تیم باید انتخاب شود'),
  })
  .refine(
    (kr) => kr.metricType !== 'NUMERIC' || (kr.targetValue !== null && kr.targetValue !== undefined),
    { message: 'برای نتیجه کلیدی عددی، تارگت الزامی است', path: ['targetValue'] }
  );

export const objectiveSchema = z.object({
  title: z.string().min(2, 'عنوان هدف الزامی است'),
  description: z.string().nullable().optional(),
  weight: z.coerce.number().positive('وزن باید مثبت باشد'),
  period: z.string().min(1, 'دوره الزامی است'),
  keyResults: z.array(keyResultSchema).optional().default([]),
});

export const checkInSchema = z
  .object({
    teamKeyResultId: z.string().min(1),
    currentValue: z.coerce.number().nullable().optional(),
    booleanValue: z.boolean().nullable().optional(),
    textValue: z.string().nullable().optional(),
    progressStatus: progressStatusEnum,
    blockerDescription: z.string().nullable().optional(),
  })
  .refine((c) => !(c.progressStatus === 'BLOCKED' && !c.blockerDescription?.trim()), {
    message: 'برای وضعیت بلاک‌شده، توضیح بلاکر الزامی است',
    path: ['blockerDescription'],
  });

export const feedbackSchema = z.object({
  score: z.coerce.number().int().min(0).max(10).nullable().optional(),
  comment: z.string().nullable().optional(),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'نام کاربری حداقل ۳ کاراکتر')
    .regex(/^[a-z0-9._-]+$/, 'نام کاربری فقط حروف لاتین کوچک، عدد، نقطه، خط تیره'),
  fullName: z.string().min(2, 'نام کامل الزامی است'),
  password: z.string().min(8, 'رمز عبور حداقل ۸ کاراکتر'),
  role: roleEnum,
  teamIds: z.array(z.string()).default([]),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  teamIds: z.array(z.string()).optional(),
  password: z.string().min(8).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'رمز فعلی الزامی است'),
  newPassword: z.string().min(8, 'رمز جدید حداقل ۸ کاراکتر'),
});
