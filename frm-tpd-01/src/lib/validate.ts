// اعتبارسنجی نرم هر مرحله — پیام‌ها مؤدبانه و مشخص

import type { FormState, StepId } from '../state';
import { OTHER_PERSON_ID, fieldRequired, triageAnswered } from '../state';
import { MIN_CHARS, meets, validItems } from './limits';
import { toFaDigits } from './jalali';

/** پیام کوتاه «کم‌بودن طول» */
const short = (label: string, min: number) =>
  `${label} (دست‌کم ${toFaDigits(min)} کاراکتر)`;

/** فهرست چیزهایی که برای عبور از این مرحله کم است (خالی = معتبر) */
export function stepMissing(step: StepId, state: FormState): string[] {
  const missing: string[] = [];
  switch (step) {
    case 'title':
      if (!meets(state.title, MIN_CHARS.title))
        missing.push(short('عنوان درخواست', MIN_CHARS.title));
      if (!state.personId) {
        missing.push('انتخاب نام درخواست‌دهنده');
      } else if (state.personId === OTHER_PERSON_ID) {
        if (!meets(state.customName, MIN_CHARS.customName))
          missing.push(short('نام و نام خانوادگی', MIN_CHARS.customName));
        if (!meets(state.customRole, MIN_CHARS.customRole))
          missing.push(short('سمت سازمانی', MIN_CHARS.customRole));
      }
      break;
    case 'request':
      if (state.requestTypes.length === 0) missing.push('دست‌کم یک نوع درخواست');
      if (!state.product) missing.push('محصول هدف');
      if (!triageAnswered(state)) missing.push('پاسخ به هر چهار گزارهٔ مسیر بررسی');
      break;
    case 'problem':
      if (!meets(state.problem, MIN_CHARS.problem))
        missing.push(short('صورت‌مسئله', MIN_CHARS.problem));
      if (
        fieldRequired(state, 'currentState') &&
        !meets(state.currentState, MIN_CHARS.currentState)
      )
        missing.push(short('وضعیت فعلی', MIN_CHARS.currentState));
      if (
        fieldRequired(state, 'desiredState') &&
        !meets(state.desiredState, MIN_CHARS.desiredState)
      )
        missing.push(short('وضعیت مطلوب', MIN_CHARS.desiredState));
      if (
        fieldRequired(state, 'businessValue') &&
        !meets(state.businessValue, MIN_CHARS.businessValue)
      )
        missing.push(short('ارزش کسب‌وکاری', MIN_CHARS.businessValue));
      break;
    case 'criteria':
      if (
        fieldRequired(state, 'criteria') &&
        validItems(state.criteria, MIN_CHARS.criterion).length === 0
      )
        missing.push(short('دست‌کم یک معیار پذیرش', MIN_CHARS.criterion));
      if (
        fieldRequired(state, 'outOfScope') &&
        validItems(state.outOfScope, MIN_CHARS.scopeItem).length === 0
      )
        missing.push(short('دست‌کم یک مورد خارج از دامنه', MIN_CHARS.scopeItem));
      break;
    case 'bug':
      if (!meets(state.bugSteps, MIN_CHARS.bugSteps))
        missing.push(short('مراحل بازتولید', MIN_CHARS.bugSteps));
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
