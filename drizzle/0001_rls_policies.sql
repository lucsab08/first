-- Row-level security policies per §8.2
-- Run after drizzle-kit push applies the base schema.

-- Enable RLS on user-owned tables
alter table users                enable row level security;
alter table user_preferences     enable row level security;
alter table bookings             enable row level security;
alter table favorites            enable row level security;
alter table reviews              enable row level security;
alter table coach_conversations  enable row level security;
alter table coach_messages       enable row level security;
alter table coach_plans          enable row level security;
alter table subscriptions        enable row level security;
alter table push_subscriptions   enable row level security;

-- Enable RLS on public-read tables (writes restricted to service role)
alter table studios              enable row level security;
alter table studio_locations     enable row level security;
alter table instructors          enable row level security;
alter table classes              enable row level security;
alter table class_sessions       enable row level security;

-- ── User-owned tables: owner-only access ──────────────────────────────────

create policy "users_own" on users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "user_preferences_own" on user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bookings_own" on bookings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "favorites_own" on favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach_conversations_own" on coach_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach_messages_own" on coach_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach_plans_own" on coach_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions_own" on subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_own" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Reviews: public read, write requires completed booking at studio ──────

create policy "reviews_public_read" on reviews for select using (true);

create policy "reviews_insert_if_completed_booking" on reviews
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from bookings b
      join class_sessions cs on cs.id = b.session_id
      join classes c on c.id = cs.class_id
      where b.user_id = auth.uid()
        and c.studio_id = reviews.studio_id
        and b.status = 'completed'
    )
  );

create policy "reviews_update_own" on reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reviews_delete_own" on reviews
  for delete using (auth.uid() = user_id);

-- ── Catalog tables: public read, writes service-role only ─────────────────

create policy "studios_public_read"          on studios          for select using (true);
create policy "studio_locations_public_read" on studio_locations for select using (true);
create policy "instructors_public_read"      on instructors      for select using (true);
create policy "classes_public_read"          on classes          for select using (true);
create policy "class_sessions_public_read"   on class_sessions   for select using (true);
