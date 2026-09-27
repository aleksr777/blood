export type DepartmentRecord = {
  id: number;
  name: string;
};

export type DatabaseAction =
  | 'init'
  | 'departments:list'
  | 'departments:remember'
  | 'departments:rename'
  | 'departments:remove'
  | 'departments:import';

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
