-- Supabase SQL Editor 에서 실행하세요.

-- 1. 식당 테이블 (기존 테이블 수정/생성)
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
  created_at timestamptz not null default now(),
  recommend_count integer not null default 0,
  top_menu text
);

-- 기존 테이블이 존재할 경우를 위해 컬럼들 안전하게 추가
alter table public.restaurants add column if not exists recommend_count integer not null default 0;
alter table public.restaurants add column if not exists top_menu text;

create index if not exists restaurants_category_idx on public.restaurants (category);
create index if not exists restaurants_created_at_idx on public.restaurants (created_at desc);

-- 2. 댓글(리뷰) 테이블
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_restaurant_id_idx on public.comments (restaurant_id);
create index if not exists comments_created_at_idx on public.comments (created_at desc);

-- RLS 활성화: 이 앱은 모든 DB 접근을 서버(service_role)를 통해서만 하므로
-- 정책을 따로 열지 않아도 됩니다. (service_role 은 RLS 를 우회)
alter table public.restaurants enable row level security;
alter table public.comments enable row level security;

