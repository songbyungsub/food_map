import { NextResponse } from "next/server";
import { getSupabaseServer, RESTAURANTS_TABLE } from "@/lib/supabaseServer";

// POST /api/restaurants/[id]/recommend — 식당 추천 수 증감 (undo 여부에 따라)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "식당 ID가 누락되었습니다." }, { status: 400 });
  }

  let undo = false;
  try {
    const body = await request.json();
    undo = !!body.undo;
  } catch {
    // 요청 본문이 없거나 JSON 형식이 아닐 경우 기본값은 추천(+1)으로 처리
  }

  const supabase = getSupabaseServer();

  // 1. 현재 추천수 조회
  const { data: restaurant, error: fetchError } = await supabase
    .from(RESTAURANTS_TABLE)
    .select("recommend_count")
    .eq("id", id)
    .single();

  if (fetchError || !restaurant) {
    console.error("[POST /api/restaurants/[id]/recommend] Fetch error:", fetchError);
    return NextResponse.json({ error: "식당 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  // 2. 추천수 증감 계산
  const currentCount = restaurant.recommend_count || 0;
  const newCount = undo ? Math.max(0, currentCount - 1) : currentCount + 1;

  const { data: updated, error: updateError } = await supabase
    .from(RESTAURANTS_TABLE)
    .update({ recommend_count: newCount })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    console.error("[POST /api/restaurants/[id]/recommend] Update error:", updateError);
    return NextResponse.json({ error: "추천 처리에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(updated);
}
