-- Fil en direct (bêta) : projet_id must look like a live thread id, f- then 8 to 120 letters,
-- digits, - or _ (what the app generates). Demo ids and invented formats are refused (23514).

alter table public.messages drop constraint if exists messages_projet_id_format;
alter table public.messages add constraint messages_projet_id_format
  check (projet_id ~ '^f-[A-Za-z0-9_-]{8,120}$');
