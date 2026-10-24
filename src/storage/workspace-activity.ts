export const WORKSPACE_INACTIVITY_MS = 24 * 60 * 60 * 1000;
export const WORKSPACE_ACTIVITY_KEY = 'blood:last-activity-at';

export const readWorkspaceActivity = () => {
  const value = Number(window.localStorage.getItem(WORKSPACE_ACTIVITY_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const writeWorkspaceActivity = (time: number) => {
  window.localStorage.setItem(WORKSPACE_ACTIVITY_KEY, String(time));
};

export const isWorkspaceInactive = (lastActivity: number | null, now = Date.now()) =>
  lastActivity !== null && now - lastActivity > WORKSPACE_INACTIVITY_MS;
