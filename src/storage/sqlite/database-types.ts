import type { DatabaseErrorCode } from './database-errors';

export type ProtocolValuesRecord = Record<string, string>;

export type DepartmentRecord = {
  id: number;
  name: string;
};

export type SavedOptionRecord = {
  id: number;
  value: string;
};

export type RecipientRecord = {
  id: number;
  fullName: string;
  profile: ProtocolValuesRecord;
  protocolCount: number;
  registrationCount: number;
  individualSelectionDirectionCount: number;
  componentRequestCount: number;
};

export type ProtocolRecord = {
  id: number;
  recipientId: number;
  values: ProtocolValuesRecord;
  createdAt: number;
  updatedAt: number;
};

export type RegistrationRecord = {
  id: number;
  recipientId: number;
  values: ProtocolValuesRecord;
  createdAt: number;
  updatedAt: number;
};

export type BloodRequestRecordKind = 'individual-selection-direction' | 'component-request';

export type BloodRequestRecordValues = Record<string, unknown>;

export type BloodRequestRecord = {
  id: number;
  recipientId: number;
  kind: BloodRequestRecordKind;
  values: BloodRequestRecordValues;
  createdAt: number;
  updatedAt: number;
};

export type SaveBloodRequestRecordInput = {
  recipientId: number;
  kind: BloodRequestRecordKind;
  values: BloodRequestRecordValues;
};

export type ComponentUnitNumberMatch = {
  id: number;
  recipientId: number;
  recipientName: string;
  transfusionDate: string;
};

export type ProtocolDraftState = {
  values: ProtocolValuesRecord;
  protocolRecordId: number | null;
  updatedAt: number;
};

export type RegistrationDraftState = {
  values: ProtocolValuesRecord;
  registrationRecordId: number | null;
  updatedAt: number;
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
  | 'protocol-draft:clear'
  | 'registration-draft:load'
  | 'registration-draft:save'
  | 'registration-draft:clear'
  | 'recipients:search'
  | 'recipients:get'
  | 'recipients:find-name'
  | 'recipients:create'
  | 'recipients:update'
  | 'recipients:remove'
  | 'protocol-records:list'
  | 'protocol-records:find-component-unit'
  | 'protocol-records:save'
  | 'protocol-records:remove'
  | 'registration-records:list'
  | 'registration-records:save'
  | 'registration-records:remove'
  | 'blood-request-records:list'
  | 'blood-request-records:save'
  | 'blood-request-records:remove';

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
  errorCode?: DatabaseErrorCode;
};
