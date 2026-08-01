import * as migration_20260712_121529_init from './20260712_121529_init';
import * as migration_20260801_132426_add_blog_posts from './20260801_132426_add_blog_posts';
import * as migration_20260801_231631_add_thumbnails from './20260801_231631_add_thumbnails';

export const migrations = [
  {
    up: migration_20260712_121529_init.up,
    down: migration_20260712_121529_init.down,
    name: '20260712_121529_init',
  },
  {
    up: migration_20260801_132426_add_blog_posts.up,
    down: migration_20260801_132426_add_blog_posts.down,
    name: '20260801_132426_add_blog_posts',
  },
  {
    up: migration_20260801_231631_add_thumbnails.up,
    down: migration_20260801_231631_add_thumbnails.down,
    name: '20260801_231631_add_thumbnails'
  },
];
