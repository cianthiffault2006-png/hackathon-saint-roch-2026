-- Fil en direct (bêta) : contact details are checked before links.
-- The smoke test showed « camille@exemple.org » refused as fil_lien (its domain matched the link
-- rule first); it is now refused as fil_coordonnees, which tells the person what to change.
-- Same function as 0001 otherwise.

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

  -- Contact details: an e-mail address or a North American phone number.
  if new.texte ~* '[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}'
     or new.texte ~ '(\+?1[ .-]?)?\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}' then
    raise exception using errcode = 'P0001', message = 'fil_coordonnees', hint = 'Ne partagez pas de coordonnées dans le fil.';
  end if;

  -- Obvious links: scheme, www., or a bare domain on common spam TLDs.
  -- Bare .ca/.co/.me are allowed on purpose: « ca » for « ça » after a missing space is common.
  if new.texte ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|io|info|biz|xyz|app|ly|gg|link|site|online|shop|top|ru|cn)\M)' then
    raise exception using errcode = 'P0001', message = 'fil_lien', hint = 'Les liens ne sont pas permis dans le fil.';
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
