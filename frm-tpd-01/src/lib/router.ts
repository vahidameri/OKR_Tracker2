// مسیریابی سبک روی History API — هر مرحله یک آدرس مستقل دارد.
// nginx با try_files به index.html برمی‌گردد، پس لینک مستقیم هم کار می‌کند.

import type { StepId } from '../state';

/** آدرس صفحهٔ آغازین — پیش از شروع ویزارد */
export const LANDING_PATH = '/';

export const STEP_PATHS: Record<StepId, string> = {
  request: '/request',
  problem: '/problem',
  scope: '/scope',
  priority: '/priority',
  review: '/review',
};

const PATH_TO_STEP = Object.fromEntries(
  Object.entries(STEP_PATHS).map(([step, path]) => [path, step as StepId]),
) as Record<string, StepId>;

/** مرحلهٔ متناظر با آدرس فعلی مرورگر (اگر آدرس ناشناخته بود، null) */
export function stepFromPath(pathname: string): StepId | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return PATH_TO_STEP[clean] ?? null;
}

export function pushLanding() {
  if (window.location.pathname !== LANDING_PATH) {
    window.history.pushState({ landing: true }, '', LANDING_PATH);
  }
}

export function replaceLanding() {
  window.history.replaceState({ landing: true }, '', LANDING_PATH);
}

export function pushStep(step: StepId) {
  const path = STEP_PATHS[step];
  if (window.location.pathname !== path) {
    window.history.pushState({ step }, '', path);
  }
}

export function replaceStep(step: StepId) {
  window.history.replaceState({ step }, '', STEP_PATHS[step]);
}
