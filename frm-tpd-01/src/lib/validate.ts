// اعتبارسنجی نرم هر مرحله — پیام‌ها مؤدبانه و مشخص

import type { FormState, StepId } from '../state';
import {
  OTHER_PERSON_ID,
  fieldRequired,
  filledItems,
  triageAnswered,
} from '../state';

/** فهرست چیزهایی که برای عبور از این مرحله کم است (خالی = معتبر) */
export function stepMissing(step: StepId, state: FormState): string[] {
  const missing: string[] = [];
  switch (step) {
    case 'start':
      if (!state.docType) missing.push('نوع سند');
      if (!state.personId) {
        missing.push('انتخاب نام درخواست‌دهنده');
      } else if (state.personId === OTHER_PERSON_ID) {
        if (!state.customName.trim()) missing.push('نام و نام خانوادگی');
        if (!state.customRole.trim()) missing.push('سمت سازمانی');
      }
      if (!state.title.trim()) missing.push('عنوان درخواست');
      break;
    case 'request':
      if (state.requestTypes.length === 0) missing.push('دست‌کم یک نوع درخواست');
      if (!state.product) missing.push('محصول هدف');
      if (!triageAnswered(state)) missing.push('پاسخ به هر چهار گزارهٔ مسیر بررسی');
      break;
    case 'problem':
      if (!state.problem.trim()) missing.push('صورت‌مسئله');
      if (fieldRequired(state, 'currentState') && !state.currentState.trim())
        missing.push('وضعیت فعلی');
      if (fieldRequired(state, 'desiredState') && !state.desiredState.trim())
        missing.push('وضعیت مطلوب');
      if (fieldRequired(state, 'businessValue') && !state.businessValue.trim())
        missing.push('ارزش کسب‌وکاری');
      break;
    case 'criteria':
      if (fieldRequired(state, 'criteria') && filledItems(state.criteria).length === 0)
        missing.push('دست‌کم یک معیار پذیرش');
      if (fieldRequired(state, 'outOfScope') && filledItems(state.outOfScope).length === 0)
        missing.push('دست‌کم یک مورد خارج از دامنه');
      break;
    case 'bug':
      if (!state.bugSteps.trim()) missing.push('مراحل بازتولید');
      if (!state.bugSeverity) missing.push('شدت پیشنهادی');
      break;
    case 'priority':
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
