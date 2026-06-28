import { NextResponse } from "next/server";
import { getSupabaseServer, RESTAURANTS_TABLE } from "@/lib/supabaseServer";
import { isCategory } from "@/lib/types";

// PUT /api/restaurants/[id] — 식당 정보 수정
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "식당 ID가 누락되었습니다." }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = body.category;

  // 필수 검증
  if (!name) {
    return NextResponse.json({ error: "식당 이름은 필수입니다." }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: "유효하지 않은 카테고리입니다." }, { status: 400 });
  }

  const row = {
    name,
    category,
    address: typeof body.address === "string" ? body.address.trim() || null : null,
    road_address:
      typeof body.road_address === "string" ? body.road_address.trim() || null : null,
    memo: typeof body.memo === "string" ? body.memo.trim() || null : null,
    place_url: typeof body.place_url === "string" ? body.place_url.trim() || null : null,
  };

  const { data, error } = await getSupabaseServer()
    .from(RESTAURANTS_TABLE)
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[PUT /api/restaurants/[id]]", error.message);
    return NextResponse.json({ error: "식당 정보 수정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/restaurants/[id] — 식당 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "식당 ID가 누락되었습니다." }, { status: 400 });
  }

  const { error } = await getSupabaseServer()
    .from(RESTAURANTS_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[DELETE /api/restaurants/[id]]", error.message);
    return NextResponse.json({ error: "식당 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
