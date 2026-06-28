import { NextResponse } from "next/server";
import { getSupabaseServer, RESTAURANTS_TABLE } from "@/lib/supabaseServer";
import { isCategory, type NewRestaurant } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/restaurants — 전체 식당 목록
export async function GET() {
  const { data, error } = await getSupabaseServer()
    .from(RESTAURANTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/restaurants]", error.message);
    return NextResponse.json({ error: "목록을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/restaurants — 새 식당 추가
export async function POST(request: Request) {
  let body: Partial<NewRestaurant>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = body.category;
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  // 검증
  if (!name) {
    return NextResponse.json({ error: "식당 이름은 필수입니다." }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: "유효하지 않은 카테고리입니다." }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "위치 정보(좌표)가 올바르지 않습니다." }, { status: 400 });
  }

  const row = {
    name,
    category,
    lat,
    lng,
    address: typeof body.address === "string" ? body.address.trim() || null : null,
    road_address:
      typeof body.road_address === "string" ? body.road_address.trim() || null : null,
    memo: typeof body.memo === "string" ? body.memo.trim() || null : null,
    place_url: typeof body.place_url === "string" ? body.place_url.trim() || null : null,
    top_menu: typeof body.top_menu === "string" ? body.top_menu.trim() || null : null,
  };

  const { data, error } = await getSupabaseServer()
    .from(RESTAURANTS_TABLE)
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("[POST /api/restaurants]", error.message);
    return NextResponse.json({ error: "식당을 추가하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
