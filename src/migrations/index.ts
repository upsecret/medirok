import * as migration_20260712_121529_init from './20260712_121529_init';

export const migrations = [
  {
    up: migration_20260712_121529_init.up,
    down: migration_20260712_121529_init.down,
    name: '20260712_121529_init'
  },
];
