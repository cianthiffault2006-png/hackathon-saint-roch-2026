-- Fil en direct (bêta) : reports, take 2.
-- 1. Advisors 0028/0029 flagged public.signaler(uuid): a SECURITY DEFINER function callable by anon
--    in the exposed schema. Reporting by anonymous visitors is the intended feature, so the
--    privileged part moves to a schema the API does not expose (private), behind a
--    SECURITY INVOKER wrapper in public, as Supabase recommends.
-- 2. Each device may report at most 10 messages an hour (error P0001 'signal_limite'); a report of
--    a message that is already hidden or does not exist changes nothing and is not counted.
--    The device id is chosen by the client, so this slows a troll down; it does not stop one.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists private.signalements (
  id bigint generated always as identity primary key,
  message_id uuid not null references public.messages (id) on delete cascade,
  appareil_id text not null check (char_length(appareil_id) between 8 and 64),
  cree_le timestamptz not null default now()
);
create index if not exists signalements_appareil_cree_le_idx on private.signalements (appareil_id, cree_le);
create index if not exists signalements_message_idx on private.signalements (message_id);
alter table private.signalements enable row level security;
revoke all on table private.signalements from public, anon, authenticated;

drop function if exists public.signaler(uuid);

create or replace function private.signaler(message_id uuid, appareil_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if appareil_id is null or char_length(appareil_id) not between 8 and 64 then
    raise exception using errcode = '22023', message = 'signal_invalide';
  end if;

  perform pg_advisory_xact_lock(hashtext('signal:' || appareil_id));

  -- Already hidden or unknown: nothing to do, nothing counted.
  if not exists (select 1 from public.messages m where m.id = signaler.message_id and not m.signale) then
    return;
  end if;

  select count(*) into n from private.signalements s
  where s.appareil_id = signaler.appareil_id
    and s.cree_le > now() - interval '1 hour';
  if n >= 10 then
    raise exception using errcode = 'P0001', message = 'signal_limite', hint = 'Trop de signalements. Réessayez dans une heure.';
  end if;

  insert into private.signalements (message_id, appareil_id) values (signaler.message_id, signaler.appareil_id);
  update public.messages m set signale = true where m.id = signaler.message_id;
end;
$$;

revoke all on function private.signaler(uuid, text) from public, anon, authenticated;
grant execute on function private.signaler(uuid, text) to anon, authenticated;

-- The API entry point: /rest/v1/rpc/signaler { message_id, appareil_id }.
create or replace function public.signaler(message_id uuid, appareil_id text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.signaler(message_id, appareil_id);
$$;

revoke all on function public.signaler(uuid, text) from public, anon, authenticated;
grant execute on function public.signaler(uuid, text) to anon, authenticated;
