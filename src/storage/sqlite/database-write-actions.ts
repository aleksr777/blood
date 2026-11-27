import type { DatabaseAction } from './database-types';

const mutatingActions = new Set<DatabaseAction>([
  'departments:remember',
  'departments:rename',
  'departments:remove',
  'departments:import',
  'saved-options:remember',
  'saved-options:rename',
  'saved-options:remove',
  'working-drafts:reset',
  'protocol-draft:save',
  'protocol-draft:clear',
  'registration-draft:save',
  'registration-draft:clear',
  'recipients:create',
  'recipients:update',
  'recipients:remove',
  'protocol-records:save',
  'protocol-records:remove',
  'registration-records:save',
  'registration-records:remove',
  'blood-request-records:save',
  'blood-request-records:remove',
]);

export const isDatabaseWrite = (action: DatabaseAction) => mutatingActions.has(action);
