import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { initializeSchema } from './database-schema';
import { migrateSharedSavedOptions } from './shared-saved-options-migration';
import { listSavedOptions, rememberSavedOption, removeSavedOption } from './saved-option-store';

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
afterEach(() => state.db?.close());

it('merges names from the protocol, request and direction and preserves group isolation', async () => {
  await rememberSavedOption('componentName:erythrocytes', 'Название А');
  await rememberSavedOption('componentRequestRequiredComponent:erythrocytes', 'название а');
  await rememberSavedOption('individualSelectionRequiredComponent', 'Название Б');
  await rememberSavedOption('componentRequestRequiredComponent:plasma', 'Название А');
  await rememberSavedOption('componentRequestRequiredComponent:platelets', 'Название В');
  await rememberSavedOption('componentName', 'Эритроцитный компонент X');
  await rememberSavedOption('componentName', 'Неопределённое название');
  await rememberSavedOption('componentRequestRequiredComponent:unselected', 'СЗП X');
  migrateSharedSavedOptions(state.db!);
  const rbc = await listSavedOptions('componentName:erythrocytes');
  expect(rbc).toHaveLength(3);
  expect(rbc.some(({ value }) => value === 'Название Б')).toBe(true);
  expect(
    (await listSavedOptions('componentName:plasma-cryo')).map(({ value }) => value).sort(),
  ).toEqual(['Название А', 'СЗП X']);
  expect((await listSavedOptions('componentName:platelets'))[0].value).toBe('Название В');
  expect((await listSavedOptions('componentName'))[0].value).toBe('Неопределённое название');
  expect(await listSavedOptions('individualSelectionRequiredComponent')).toEqual([]);
  await removeSavedOption('componentName:erythrocytes', rbc[0].id);
  const edited = await listSavedOptions('componentName:erythrocytes');
  migrateSharedSavedOptions(state.db!);
  expect(await listSavedOptions('componentName:erythrocytes')).toEqual(edited);
});

it('rolls back all option groups if moving a legacy component name fails', async () => {
  const scoped = await rememberSavedOption('individualSelectionRequiredComponent', 'Название А');
  const legacy = await rememberSavedOption('componentName', 'Плазма X');
  const color = await rememberSavedOption('beforeUrineColor', 'Светлая');
  state.db!.exec(`CREATE TRIGGER fail_component_merge BEFORE INSERT ON saved_options
    WHEN NEW.category = 'componentName:plasma-cryo'
    BEGIN SELECT RAISE(ABORT, 'Test component merge failure'); END`);
  expect(() => migrateSharedSavedOptions(state.db!)).toThrow('Test component merge failure');
  expect(await listSavedOptions('individualSelectionRequiredComponent')).toEqual(scoped);
  expect(await listSavedOptions('componentName')).toEqual(legacy);
  expect(await listSavedOptions('beforeUrineColor')).toEqual(color);
  expect(await listSavedOptions('componentName:erythrocytes')).toEqual([]);
});
