create table auth_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  expires_at timestamptz not null,
  revoked boolean not null default false
);
