-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  email text, -- mirror of auth.users.email (DO NOT store passwords)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- (If applying to an existing project run separately in SQL editor):
alter table public.profiles add column if not exists email text;
create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

-- Self-care ideas table
create table public.self_care_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  category text,
  description text,
  supplies text,
  time_required int
);

-- Option B: Simple trigger to auto-create a profile row on new auth user (in addition to client upsert fallback)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  -- Basic derived username (before @) fallback to first 8 chars of UUID
  insert into public.profiles (id, username, full_name, email)
  values (
    new.id,
    coalesce(nullif(regexp_replace(split_part(new.email,'@',1),'[^a-zA-Z0-9_]+','', 'g'),''), substr(new.id::text,1,8)),
    null,
    new.email
  )
  on conflict (id) do nothing; -- ignore if client already inserted
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- (Optional) one-time backfill (run manually then comment out)
-- insert into public.profiles (id, username, full_name, email)
-- select u.id,
--        coalesce(nullif(regexp_replace(split_part(u.email,'@',1),'[^a-zA-Z0-9_]+','', 'g'),''), substr(u.id::text,1,8)),
--        null,
--        u.email
-- from auth.users u
-- left join public.profiles p on p.id = u.id
-- where p.id is null;

-- Enable RLS and policies for self_care_ideas
alter table public.self_care_ideas enable row level security;

create policy if not exists "Public read self care ideas" on public.self_care_ideas
for select using (true);

create policy if not exists "Users insert own self care ideas" on public.self_care_ideas
for insert with check (auth.uid() = user_id);

create policy if not exists "Users update own self care ideas" on public.self_care_ideas
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Users delete own self care ideas" on public.self_care_ideas
for delete using (auth.uid() = user_id);

create index if not exists self_care_ideas_created_at_idx on public.self_care_ideas (created_at desc);

-- Additional schema enhancements
alter table public.self_care_ideas add column if not exists slug text;
alter table public.self_care_ideas add column if not exists image_path text; -- storage key for a representative image

-- Backfill slug for existing rows (safe to run multiple times)
update public.self_care_ideas
set slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

create unique index if not exists self_care_ideas_slug_idx on public.self_care_ideas(slug);

-- Likes table
create table if not exists public.idea_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  idea_id uuid references public.self_care_ideas(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, idea_id)
);

-- Bookmarks table
create table if not exists public.idea_bookmarks (
  user_id uuid references public.profiles(id) on delete cascade,
  idea_id uuid references public.self_care_ideas(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, idea_id)
);

-- Tags & join (many-to-many)
create table if not exists public.tags (
  id bigserial primary key,
  name text unique not null
);

create table if not exists public.idea_tags (
  idea_id uuid references public.self_care_ideas(id) on delete cascade,
  tag_id bigint references public.tags(id) on delete cascade,
  primary key(idea_id, tag_id)
);

-- RLS for new tables
alter table public.idea_likes enable row level security;
alter table public.idea_bookmarks enable row level security;
alter table public.tags enable row level security;
alter table public.idea_tags enable row level security;

create policy if not exists "Read likes" on public.idea_likes for select using (true);
create policy if not exists "Manage own likes" on public.idea_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Read bookmarks" on public.idea_bookmarks for select using (true);
create policy if not exists "Manage own bookmarks" on public.idea_bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Read tags" on public.tags for select using (true);
create policy if not exists "Insert tags when authed" on public.tags for insert with check (auth.uid() is not null);

create policy if not exists "Read idea_tags" on public.idea_tags for select using (true);
create policy if not exists "Manage idea_tags owner" on public.idea_tags for insert using (
  auth.uid() = (select user_id from public.self_care_ideas sci where sci.id = idea_tags.idea_id)
) with check (
  auth.uid() = (select user_id from public.self_care_ideas sci where sci.id = idea_tags.idea_id)
);
