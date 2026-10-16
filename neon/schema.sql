-- شغّل الملف ده مرة واحدة على Neon PostgreSQL.

create extension if not exists "pgcrypto";

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  product text,
  media_url text not null,
  kind text not null default 'video' check (kind in ('photo', 'video', 'reel')),
  active boolean not null default true,
  times_posted int not null default 0,
  last_posted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists captions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  text text not null,
  times_used int not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete set null,
  caption_id uuid references captions(id) on delete set null,
  kind text,
  fb_post_id text,
  fb_link text,
  status text not null check (status in ('success', 'error')),
  error text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  paused boolean not null default false,
  min_gap_days int not null default 7,
  min_hours_between int not null default 3
);
insert into settings (id) values (1) on conflict (id) do nothing;

create table if not exists user_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists captions_video_idx on captions(video_id);
create index if not exists posts_created_idx on posts(created_at desc);
