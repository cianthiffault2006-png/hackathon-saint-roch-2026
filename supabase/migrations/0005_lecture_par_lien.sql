-- Fil en direct (bêta) : a thread is readable only with its link.
-- Before this, anon could SELECT every thread (/rest/v1/messages) and follow the whole table on
-- Realtime, so « visibles par toute personne qui a le lien » was not true. Now:
--   - API roles have no privilege on public.messages at all (RLS stays on, with no policy);
--   - reading goes through lire_fil(projet_id, appareil_id): one thread, last 100 visible
--     messages, no author id, and de_moi = « sent from this device »;
--   - posting goes through envoyer_message(projet_id, nom, appareil_id, contenu), same trigger rules;
--   - the table leaves the Realtime publication: clients ping each other with a Realtime broadcast
--     on fil:<id> and re-read through lire_fil (they never trust a broadcast's content);
-- The privileged functions live in the unexposed private schema behind SECURITY INVOKER wrappers
-- (Supabase advisors 0028/0029).

revoke all on table public.messages from anon, authenticated;
drop policy if exists messages_lecture on public.messages;
drop policy if exists messages_ajout on public.messages;

do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime drop table public.messages;
  end if;
end;
$$;

comment on table public.messages is 'Fil en direct (bêta) de Maillage : messages par projet, lisibles seulement avec le lien (fonction lire_fil).';

-- Read one thread.
create or replace function private.lire_fil(p_projet_id text, p_appareil_id text)
returns table (id uuid, auteur text, texte text, cree_le timestamptz, de_moi boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if p_projet_id is null or p_projet_id !~ '^f-[A-Za-z0-9_-]{8,120}$' or char_length(p_projet_id) > 120 then
    raise exception using errcode = '22023', message = 'fil_invalide';
  end if;
  return query
    select r.id, r.auteur, r.texte, r.cree_le, coalesce(r.auteur_id = p_appareil_id, false)
    from (
      select m.id, m.auteur, m.texte, m.cree_le, m.auteur_id
      from public.messages m
      where m.projet_id = p_projet_id and not m.signale
      order by m.cree_le desc
      limit 100
    ) r
    order by r.cree_le asc;
end;
$$;

-- Post one message (the BEFORE INSERT trigger applies every rule).
create or replace function private.envoyer_message(p_projet_id text, p_nom text, p_appareil_id text, p_contenu text)
returns table (id uuid, auteur text, texte text, cree_le timestamptz, de_moi boolean)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
    insert into public.messages as m (projet_id, auteur, auteur_id, texte)
    values (p_projet_id, p_nom, p_appareil_id, p_contenu)
    returning m.id, m.auteur, m.texte, m.cree_le, true;
end;
$$;

revoke all on function private.lire_fil(text, text) from public, anon, authenticated;
revoke all on function private.envoyer_message(text, text, text, text) from public, anon, authenticated;
grant execute on function private.lire_fil(text, text) to anon, authenticated;
grant execute on function private.envoyer_message(text, text, text, text) to anon, authenticated;

-- API entry points: /rest/v1/rpc/lire_fil and /rest/v1/rpc/envoyer_message.
create or replace function public.lire_fil(projet_id text, appareil_id text default '')
returns table (id uuid, auteur text, texte text, cree_le timestamptz, de_moi boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.lire_fil(projet_id, appareil_id);
$$;

create or replace function public.envoyer_message(projet_id text, nom text, appareil_id text, contenu text)
returns table (id uuid, auteur text, texte text, cree_le timestamptz, de_moi boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from private.envoyer_message(projet_id, nom, appareil_id, contenu);
$$;

revoke all on function public.lire_fil(text, text) from public, anon, authenticated;
revoke all on function public.envoyer_message(text, text, text, text) from public, anon, authenticated;
grant execute on function public.lire_fil(text, text) to anon, authenticated;
grant execute on function public.envoyer_message(text, text, text, text) to anon, authenticated;
