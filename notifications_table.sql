create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  title text not null,
  body text not null,
  read boolean default false,
  created_at timestamp default now()
);

create index idx_notifications_user on notifications(user_id);
