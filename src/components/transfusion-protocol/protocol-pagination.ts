import type { ProtocolBlockId } from './protocol-types';

export type ProtocolChunkId =
  | 'general:main'
  | 'general:times'
  | 'examination:main'
  | 'examination:antigens'
  | 'indications:main'
  | 'history:main'
  | 'donor:main'
  | 'donor:blood'
  | 'donor:dates'
  | 'selection:main'
  | 'selection:date'
  | 'selection:responsible'
  | 'compatibilityTests:main'
  | 'compatibilityTests:confirmed'
  | 'compatibilityTests:tests'
  | 'complications:main'
  | 'monitoring:main'
  | 'monitoring:hour1'
  | 'monitoring:hour2'
  | 'doctor:main';

export const PROTOCOL_CHUNK_ORDER: ProtocolChunkId[] = [
  'general:main',
  'general:times',
  'examination:main',
  'examination:antigens',
  'indications:main',
  'history:main',
  'donor:main',
  'donor:blood',
  'donor:dates',
  'selection:main',
  'selection:date',
  'selection:responsible',
  'compatibilityTests:main',
  'compatibilityTests:confirmed',
  'compatibilityTests:tests',
  'complications:main',
  'monitoring:main',
  'monitoring:hour1',
  'monitoring:hour2',
  'doctor:main',
];

export const getChunkBlockId = (chunkId: ProtocolChunkId): ProtocolBlockId =>
  chunkId.slice(0, chunkId.indexOf(':')) as ProtocolBlockId;

export const getChunkPart = (chunkId: ProtocolChunkId) =>
  chunkId.slice(chunkId.indexOf(':') + 1);
