-- 20261201_contact_messages.sql
-- 📮 update-59: "අප අමතන්න" (/contact) form එකෙන් එන පණිවිඩ
--   • Login නැති අයටත් යවන්න පුළුවන් (site එකේ server එක හරහා විතරයි ලියවෙන්නේ)
--   • Admin panel → "Contact form" tab එකෙන් බලන්න / "කියෙව්වා" / "ඉවරයි" කියලා mark කරන්න
-- කීප පාරක් run කළත් කමක් නෑ.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  email       text not null check (char_length(email) between 5 and 160),
  phone       text check (phone is null or char_length(phone) <= 30),
  topic       text not null default 'general'
              check (topic in ('general', 'account', 'payment', 'safety', 'feedback', 'other')),
  message     text not null check (char_length(message) between 10 and 3000),
  user_id     uuid references auth.users (id) on delete set null,  -- 👈 login වෙලා යැව්වා නම්
  lang        text,
  ip_hash     text,                                                -- 👈 spam නවත්වන්න (ඇත්ත IP එක save කරන්නේ නෑ)
  status      text not null default 'new' check (status in ('new', 'read', 'done')),
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx  on public.contact_messages (status);
create index if not exists contact_messages_ip_idx      on public.contact_messages (ip_hash, created_at desc);

-- 🔒 RLS on + policies කිසිවක් නෑ = browser එකෙන් කෙලින්ම කියවන්න / ලියන්න බෑ.
--    Site එකේ API එක (service role key) හරහා විතරයි.
alter table public.contact_messages enable row level security;

-- 🔍 Check කරන්න (කැමති නම්):
-- select id, name, email, topic, status, created_at from public.contact_messages order by created_at desc limit 20;
