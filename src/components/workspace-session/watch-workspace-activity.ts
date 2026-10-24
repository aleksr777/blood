import {
  isWorkspaceInactive,
  readWorkspaceActivity,
  WORKSPACE_INACTIVITY_MS,
  writeWorkspaceActivity,
} from '../../storage/workspace-activity';

const activityEvents = [
  'pointerdown',
  'pointermove',
  'keydown',
  'input',
  'click',
  'wheel',
  'touchmove',
];
const listenerOptions = { capture: true, passive: false };
const PERSIST_INTERVAL_MS = 1000;

export const watchWorkspaceActivity = (onExpire: () => void) => {
  let lastActivity = readWorkspaceActivity() ?? Date.now();
  let persistedAt = lastActivity;
  let expired = false;
  let timer: number;

  const persist = () => {
    writeWorkspaceActivity(lastActivity);
    persistedAt = lastActivity;
  };
  const check = () => {
    if (expired) return true;
    const now = Date.now();
    if (isWorkspaceInactive(lastActivity, now)) {
      expired = true;
      window.clearTimeout(timer);
      onExpire();
    } else if (now < lastActivity) {
      lastActivity = now;
      persist();
    }
    return expired;
  };
  const schedule = () => {
    if (check()) return;
    timer = window.setTimeout(schedule, WORKSPACE_INACTIVITY_MS - (Date.now() - lastActivity) + 1);
  };
  const onActivity = (event: Event) => {
    // Check before recording input: the first click after sleep cannot revive an expired draft.
    if (check()) {
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    lastActivity = Date.now();
    if (lastActivity - persistedAt >= PERSIST_INTERVAL_MS) persist();
  };
  const onResume = () => {
    check();
  };
  const onVisibilityChange = () => {
    if (!check() && document.visibilityState === 'hidden') persist();
  };

  activityEvents.forEach((name) => window.addEventListener(name, onActivity, listenerOptions));
  window.addEventListener('focus', onResume);
  window.addEventListener('pageshow', onResume);
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('resume', onResume);
  schedule();

  return () => {
    window.clearTimeout(timer);
    activityEvents.forEach((name) => window.removeEventListener(name, onActivity, listenerOptions));
    window.removeEventListener('focus', onResume);
    window.removeEventListener('pageshow', onResume);
    window.removeEventListener('pagehide', persist);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('resume', onResume);
  };
};
