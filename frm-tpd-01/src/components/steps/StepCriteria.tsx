import StepShell from '../StepShell';
import CriteriaBuilder from '../CriteriaBuilder';
import Field from '../Field';
import type { Action, FormState } from '../../state';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepCriteria({ state, dispatch }: Props) {
  return (
    <StepShell
      title="معیارهای پذیرش"
      subtitle="هر معیار یک جملهٔ کامل می‌سازد: با آنکه… وقتی… آنگاه…"
    >
      <CriteriaBuilder criteria={state.criteria} dispatch={dispatch} />

      <Field label="خارج از دامنه" hint="دو موردی که عمداً در این درخواست انجام نمی‌شود">
        <input
          type="text"
          className="text-input"
          value={state.outOfScope1}
          placeholder="مورد اول — نمونه: تغییر ظاهر صفحهٔ تکالیف"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { outOfScope1: e.target.value } })
          }
        />
        <input
          type="text"
          className="text-input"
          value={state.outOfScope2}
          placeholder="مورد دوم — نمونه: پشتیبانی از نسخهٔ وب"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { outOfScope2: e.target.value } })
          }
        />
      </Field>

      <Field label="سنجهٔ موفقیت" hint="چه عددی نشان می‌دهد این کار موفق بوده؟" optional>
        <input
          type="text"
          className="text-input"
          value={state.successMetric}
          placeholder="نمونه: میانگین زمان ارسال تکلیف زیر ۲ ثانیه در داشبورد"
          onChange={(e) =>
            dispatch({ type: 'patch', patch: { successMetric: e.target.value } })
          }
        />
      </Field>
    </StepShell>
  );
}
