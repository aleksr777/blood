import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { migrateUrineColorOptions } from './urine-color-options-migration';
import { listSavedOptions, rememberSavedOption, removeSavedOption } from './saved-option-store';
import { URINE_COLOR_OPTION_CATEGORY } from '../../domain/urine-color-options';

const state = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock('./database', () => ({ getDatabase: async () => state.db }));
let sqlite3: Sqlite3Static;
beforeAll(async () => {
  sqlite3 = await sqlite3InitModule();
});
beforeEach(() => {
  state.db = new sqlite3.oo1.DB(':memory:');
  initializeSchema(state.db);
});
afterEach(() => {
  vi.restoreAllMocks();
  state.db?.close();
});

it('merges all existing period lists, deduplicates colors and preserves the newest common spelling', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(1000);
  await rememberSavedOption('beforeUrineColor', 'Жёлтая');
  await rememberSavedOption('hour1UrineColor', 'Светлая');
  await rememberSavedOption('hour2UrineColor', 'жёлтая');
  await rememberSavedOption('beforeUrine', '100 мл');
  await rememberSavedOption('reagentAntiASeries', '123');
  vi.mocked(Date.now).mockReturnValue(2000);
  await rememberSavedOption(URINE_COLOR_OPTION_CATEGORY, 'ЖЁЛТАЯ');
  migrateUrineColorOptions(state.db!);
  const colors = await listSavedOptions(URINE_COLOR_OPTION_CATEGORY);
  expect(colors.map(({ value }) => value).sort()).toEqual(['ЖЁЛТАЯ', 'Светлая']);
  for (const prefix of ['before', 'hour1', 'hour2']) {
    expect(await listSavedOptions(`${prefix}UrineColor`)).toEqual([]);
  }
  expect((await listSavedOptions('beforeUrine'))[0].value).toBe('100 мл');
  expect((await listSavedOptions('reagentAntiASeries'))[0].value).toBe('123');
  migrateUrineColorOptions(state.db!);
  expect(await listSavedOptions(URINE_COLOR_OPTION_CATEGORY)).toEqual(colors);
  await removeSavedOption(URINE_COLOR_OPTION_CATEGORY, colors[0].id);
  migrateUrineColorOptions(state.db!);
  expect(await listSavedOptions(URINE_COLOR_OPTION_CATEGORY)).toHaveLength(1);
});

it('rolls back the merge if migrating old choices fails', async () => {
  const legacy = await rememberSavedOption('beforeUrineColor', 'Жёлтая');
  state.db!.exec(`CREATE TRIGGER fail_color_merge BEFORE INSERT ON saved_options
    WHEN NEW.category = 'urineColor'
    BEGIN SELECT RAISE(ABORT, 'Test color merge failure'); END`);
  expect(() => migrateUrineColorOptions(state.db!)).toThrow('Test color merge failure');
  expect(await listSavedOptions('beforeUrineColor')).toEqual(legacy);
  expect(await listSavedOptions(URINE_COLOR_OPTION_CATEGORY)).toEqual([]);
});
