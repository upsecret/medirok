import * as migration_20260712_121529_init from './20260712_121529_init';
import * as migration_20260801_132426_add_blog_posts from './20260801_132426_add_blog_posts';
import * as migration_20260801_231631_add_thumbnails from './20260801_231631_add_thumbnails';
import * as migration_20260802_003121_add_hospital_logo from './20260802_003121_add_hospital_logo';
import * as migration_20260802_012722_add_hospital_cover from './20260802_012722_add_hospital_cover';
import * as migration_20260814_020528_add_certification_applications from './20260814_020528_add_certification_applications';

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
    name: '20260801_231631_add_thumbnails',
  },
  {
    up: migration_20260802_003121_add_hospital_logo.up,
    down: migration_20260802_003121_add_hospital_logo.down,
    name: '20260802_003121_add_hospital_logo',
  },
  {
    up: migration_20260802_012722_add_hospital_cover.up,
    down: migration_20260802_012722_add_hospital_cover.down,
    name: '20260802_012722_add_hospital_cover',
  },
  {
    up: migration_20260814_020528_add_certification_applications.up,
    down: migration_20260814_020528_add_certification_applications.down,
    name: '20260814_020528_add_certification_applications'
  },
];
