// اعتبارسنجی هر مرحله. فقط «پر بودن» بررسی می‌شود؛ طول متن سد عبور نیست و
// به‌جای آن در امتیاز آمادگی دخیل می‌شود.

import type { FormState, StepId } from '../state';
import { OTHER_PERSON_ID, fieldRequired, triageAnswered } from '../state';
import { filled } from './limits';

/** چیزهایی که برای شروع فرآیند از صفحهٔ آغازین لازم است */
export function landingMissing(state: FormState): string[] {
  const missing: string[] = [];
  if (!state.title.trim()) missing.push('عنوان درخواست');
  if (!state.personId) {
    missing.push('نام درخواست‌دهنده');
  } else if (state.personId === OTHER_PERSON_ID) {
    if (!state.customName.trim()) missing.push('نام و نام خانوادگی');
    if (!state.customRole.trim()) missing.push('سمت سازمانی');
  }
  if (!state.docType) missing.push('نوع سند');
  return missing;
}

/** فهرست چیزهایی که برای عبور از این مرحله کم است (خالی = معتبر) */
export function stepMissing(step: StepId, state: FormState): string[] {
  const missing: string[] = [];
  switch (step) {
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
      if (fieldRequired(state, 'criteria') && filled(state.criteria).length === 0)
        missing.push('دست‌کم یک معیار پذیرش');
      if (fieldRequired(state, 'outOfScope') && filled(state.outOfScope).length === 0)
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
