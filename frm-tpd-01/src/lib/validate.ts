// اعتبارسنجی نرم هر مرحله — پیام‌ها مؤدبانه و مشخص

import type { FormState, StepId } from '../state';
import { isCriterionComplete } from '../state';

/** فهرست چیزهایی که برای عبور از این مرحله کم است (خالی = معتبر) */
export function stepMissing(step: StepId, state: FormState): string[] {
  const missing: string[] = [];
  switch (step) {
    case 'person':
      if (!state.personId) missing.push('انتخاب نام درخواست‌دهنده');
      break;
    case 'type':
      if (!state.requestType) missing.push('نوع درخواست');
      if (!state.title.trim()) missing.push('عنوان درخواست');
      if (!state.product) missing.push('محصول هدف');
      break;
    case 'problem':
      if (!state.problem.trim()) missing.push('صورت‌مسئله');
      if (!state.desiredState.trim()) missing.push('وضعیت مطلوب');
      break;
    case 'criteria':
      if (!state.criteria.some(isCriterionComplete))
        missing.push('دست‌کم یک معیار پذیرش کامل (هر سه بخش پر)');
      break;
    case 'bug':
      if (!state.bugSteps.trim()) missing.push('مراحل بازتولید');
      if (!state.bugSeverity) missing.push('شدت پیشنهادی');
      break;
    case 'schedule':
      if (!state.priority) missing.push('اولویت پیشنهادی');
      break;
    case 'review':
      break;
  }
  return missing;
}

export function missingMessage(missing: string[]): string {
  return `برای رفتن به مرحلهٔ بعد فقط این موارد باقی مانده است: ${missing.join('، ')}.`;
}
