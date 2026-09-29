export type DepartmentRecord = {
  id: number;
  name: string;
};

export type SavedOptionRecord = {
  id: number;
  value: string;
};

export type DatabaseAction =
  | 'init'
  | 'departments:list'
  | 'departments:remember'
  | 'departments:rename'
  | 'departments:remove'
  | 'departments:import'
  | 'saved-options:list'
  | 'saved-options:remember'
  | 'saved-options:rename'
  | 'saved-options:remove'
  | 'protocol-draft:load'
  | 'protocol-draft:save'
  | 'protocol-draft:clear';

export type DatabaseRequest = {
  id: number;
  action: DatabaseAction;
  payload?: unknown;
};

export type DatabaseResponse = {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
};
