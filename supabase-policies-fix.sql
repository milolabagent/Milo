drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "matches_select_own" on public.matches;
drop policy if exists "matches_insert_own" on public.matches;
drop policy if exists "matches_update_own" on public.matches;

create policy "profiles_select_own"
on public.profiles
for select
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "matches_select_own"
on public.matches
for select
using ((select auth.uid()) = user_id);

create policy "matches_insert_own"
on public.matches
for insert
with check ((select auth.uid()) = user_id);

create policy "matches_update_own"
on public.matches
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
