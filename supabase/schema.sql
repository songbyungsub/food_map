-- Supabase SQL Editor 에서 실행하세요.

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  address text,
  road_address text,
  lat double precision not null,
  lng double precision not null,
  memo text,
  place_url text,
  created_at timestamptz not null default now()
);

create index if not exists restaurants_category_idx on public.restaurants (category);
create index if not exists restaurants_created_at_idx on public.restaurants (created_at desc);

-- RLS 활성화: 이 앱은 모든 DB 접근을 서버(service_role)를 통해서만 하므로
-- 정책을 따로 열지 않아도 됩니다. (service_role 은 RLS 를 우회)
alter table public.restaurants enable row level security;
