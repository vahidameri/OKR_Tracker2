import type { Action, FormState } from '../state';
import { FAST_TRACK_QUESTIONS, isFastTrack } from '../state';
import { toFaDigits } from '../lib/jalali';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<Action>;
}

/** چهار گزارهٔ مسیر سریع + badge سبز در صورت واجد شرایط بودن */
export default function FastTrackQuiz({ state, dispatch }: Props) {
  const answered = state.fastTrack.filter((a) => a !== null).length;

  return (
    <div className="fasttrack">
      {FAST_TRACK_QUESTIONS.map((q, i) => (
        <div className="fasttrack-row" key={q}>
          <span className="fasttrack-question">
            <span className="fasttrack-index" aria-hidden>
              {toFaDigits(i + 1)}
            </span>
            {q}
          </span>
          <div className="toggle-pair" role="radiogroup" aria-label={q}>
            <button
              type="button"
              role="radio"
              aria-checked={state.fastTrack[i] === 'yes'}
              className={`toggle yes${state.fastTrack[i] === 'yes' ? ' on' : ''}`}
              onClick={() =>
                dispatch({ type: 'setFastTrack', index: i, value: 'yes' })
              }
            >
              بله
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={state.fastTrack[i] === 'no'}
              className={`toggle no${state.fastTrack[i] === 'no' ? ' on' : ''}`}
              onClick={() =>
                dispatch({ type: 'setFastTrack', index: i, value: 'no' })
              }
            >
              خیر یا نمی‌دانم
            </button>
          </div>
        </div>
      ))}

      {isFastTrack(state) ? (
        <div className="fasttrack-badge" role="status">
          ✓ این درخواست واجد شرایط مسیر سریع (Fast-Track) است — در سند درج می‌شود.
        </div>
      ) : (
        <p className="fasttrack-note" aria-live="polite">
          {answered === 4
            ? 'این درخواست از مسیر عادی بررسی می‌شود؛ پاسخ «خیر یا نمی‌دانم» هیچ ایرادی ندارد و اولویت آن را کم نمی‌کند.'
            : `مسیر سریع وقتی فعال می‌شود که هر چهار گزاره «بله» باشد. (${toFaDigits(answered)} از ${toFaDigits(4)} پاسخ داده شد)`}
        </p>
      )}
    </div>
  );
}
