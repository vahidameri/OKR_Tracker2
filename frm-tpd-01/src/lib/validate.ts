// اعتبارسنجی هر مرحله. فقط «پر بودن» بررسی می‌شود؛ طول متن سد عبور نیست و
// به‌جای آن در امتیاز آمادگی دخیل می‌شود.

import type { FormState, StepId } from '../state';
import {
  OTHER_PERSON_ID,
  fieldRequired,
  isOtherProduct,
  isOtherRequestType,
  triageAnswered,
} from '../state';
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
      if (!state.requestType) missing.push('نوع درخواست');
      else if (isOtherRequestType(state) && !state.customRequestType.trim())
        missing.push('توضیح نوع درخواست');
      if (!state.product) missing.push('محصول هدف');
      else if (isOtherProduct(state) && !state.customProduct.trim())
        missing.push('نام محصول');
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
    case 'bug':
      if (!state.bugEnv.trim()) missing.push('محیط، نسخه و دستگاه');
      if (!state.bugSeverity) missing.push('شدت و دامنهٔ اثر');
      break;
    case 'scope':
      // «خارج از دامنه» دو مورد می‌خواهد؛ یک سنجهٔ موفقیت کافی است
      if (fieldRequired(state, 'outOfScope') && filled(state.outOfScope).length < 2)
        missing.push('دو مورد «خارج از دامنه»');
      if (fieldRequired(state, 'successMetrics') && filled(state.successMetrics).length === 0)
        missing.push('دست‌کم یک سنجهٔ موفقیت');
      break;
    case 'priority':
      if (!state.priority) missing.push('اولویت پیشنهادی');
      // تاریخ اختیاری است، ولی تاریخِ بی‌دلیل قابل برنامه‌ریزی نیست
      if (state.neededDate && !state.neededReason.trim())
        missing.push('دلیل تاریخ نیاز');
      break;
    case 'review':
      break;
  }
  return missing;
}
