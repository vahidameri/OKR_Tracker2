import StepShell from '../StepShell';
import PersonSelect from '../PersonSelect';
import type { Action, FormState } from '../../state';
import { findPerson } from '../../data/people';
import { todayJalaliLabel } from '../../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

export default function StepPerson({ state, dispatch }: Props) {
  const person = findPerson(state.personId);
  return (
    <StepShell title="درخواست‌دهنده">
      <PersonSelect
        value={state.personId}
        onChange={(id) => dispatch({ type: 'selectPerson', id })}
      />
      {person && (
        <p className="person-confirm">
          سمت: {person.role} · تاریخ ثبت: {todayJalaliLabel()}
        </p>
      )}
    </StepShell>
  );
}
