-- Fil en direct (bêta) : one shared, public thread per live project.
-- Anonymous visitors (publishable key, role anon) may read visible messages and post under the
-- rules of the trigger below. Nobody may update or delete through the API; a report goes through
-- public.signaler(), which only hides the message (moderation by the SDC in the pilot).
-- Error messages raised for the client (code P0001, message = key): fil_delai, fil_achalande,
-- fil_repetition, fil_lien, fil_coordonnees, fil_sature. Length checks raise 23514.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  projet_id text not null check (char_length(projet_id) between 1 and 120),
  auteur text not null check (char_length(auteur) between 1 and 40),
  auteur_id text not null check (char_length(auteur_id) between 8 and 64),
  texte text not null check (char_length(texte) between 1 and 500),
  signale boolean not null default false,
  cree_le timestamptz not null default now()
);

comment on table public.messages is 'Fil en direct (bêta) de Maillage : messages publics par projet, lisibles par toute personne qui a le lien.';

create index if not exists messages_projet_cree_le_idx on public.messages (projet_id, cree_le);
-- For the per-author and service-wide limits of the trigger.
create index if not exists messages_cree_le_idx on public.messages (cree_le);

-- Privileges: read and insert only, and insert only the four columns a client may choose.
revoke all on table public.messages from anon, authenticated;
grant select on table public.messages to anon, authenticated;
grant insert (projet_id, auteur, auteur_id, texte) on table public.messages to anon, authenticated;

alter table public.messages enable row level security;

drop policy if exists messages_lecture on public.messages;
create policy messages_lecture on public.messages
  for select to anon, authenticated
  using (not signale);

drop policy if exists messages_ajout on public.messages;
create policy messages_ajout on public.messages
  for insert to anon, authenticated
  with check (not signale);

-- No UPDATE or DELETE policy: both are refused to anon and authenticated.

-- Anti-abuse, server side (the client keeps its own slow mode too).
-- SECURITY DEFINER so the counts include hidden (reported) messages, which RLS hides from anon.
create or replace function public.messages_avant_ajout()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  -- The server decides these, whatever the client sent.
  new.id := gen_random_uuid();
  new.cree_le := now();
  new.signale := false;
  new.auteur := btrim(new.auteur);
  new.texte := btrim(new.texte);

  -- Obvious links: scheme, www., or a bare domain on common spam TLDs.
  -- Bare .ca/.co/.me are allowed on purpose: « ca » for « ça » after a missing space is common.
  if new.texte ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|io|info|biz|xyz|app|ly|gg|link|site|online|shop|top|ru|cn)\M)' then
    raise exception using errcode = 'P0001', message = 'fil_lien', hint = 'Les liens ne sont pas permis dans le fil.';
  end if;

  -- Contact details: an e-mail address or a North American phone number.
  if new.texte ~* '[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}'
     or new.texte ~ '(\+?1[ .-]?)?\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}' then
    raise exception using errcode = 'P0001', message = 'fil_coordonnees', hint = 'Ne partagez pas de coordonnées dans le fil.';
  end if;

  -- One insert at a time per thread, so concurrent posts cannot slip past the counts.
  perform pg_advisory_xact_lock(hashtext('fil:' || new.projet_id));

  -- Same device, same thread: one message every 15 seconds.
  if exists (
    select 1 from public.messages m
    where m.projet_id = new.projet_id
      and m.auteur_id = new.auteur_id
      and m.cree_le > now() - interval '15 seconds'
  ) then
    raise exception using errcode = 'P0001', message = 'fil_delai', hint = 'Attendez 15 secondes entre deux messages.';
  end if;

  -- One thread: at most 30 messages a minute (the 31st is refused).
  select count(*) into n from public.messages m
  where m.projet_id = new.projet_id
    and m.cree_le > now() - interval '1 minute';
  if n >= 30 then
    raise exception using errcode = 'P0001', message = 'fil_achalande', hint = 'Le fil est très actif. Réessayez dans une minute.';
  end if;

  -- Same device, same text (any thread): 3 times in 10 minutes, then refused.
  select count(*) into n from public.messages m
  where m.auteur_id = new.auteur_id
    and lower(m.texte) = lower(new.texte)
    and m.cree_le > now() - interval '10 minutes';
  if n >= 3 then
    raise exception using errcode = 'P0001', message = 'fil_repetition', hint = 'Ce message a déjà été envoyé plusieurs fois.';
  end if;

  -- Whole service: at most 120 messages a minute, to protect the free tier.
  select count(*) into n from public.messages m
  where m.cree_le > now() - interval '1 minute';
  if n >= 120 then
    raise exception using errcode = 'P0001', message = 'fil_sature', hint = 'Le service est très sollicité. Réessayez dans une minute.';
  end if;

  return new;
end;
$$;

revoke all on function public.messages_avant_ajout() from public, anon, authenticated;

drop trigger if exists messages_avant_ajout on public.messages;
create trigger messages_avant_ajout
  before insert on public.messages
  for each row execute function public.messages_avant_ajout();

-- Report a message: hides it for everyone (RLS shows only rows where not signale).
create or replace function public.signaler(message_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages set signale = true where id = message_id;
$$;

revoke all on function public.signaler(uuid) from public, anon, authenticated;
grant execute on function public.signaler(uuid) to anon, authenticated;

-- Realtime: new and changed rows reach subscribers (RLS still applies to what they receive).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
