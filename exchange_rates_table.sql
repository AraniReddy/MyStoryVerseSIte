create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  rate float8 not null,
  last_updated timestamp with time zone default current_timestamp
);

-- Optional index for faster queries
create index exchange_from_to_idx on public.exchange_rates(from_currency, to_currency);
