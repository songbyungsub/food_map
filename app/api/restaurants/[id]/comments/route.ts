import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const COMMENTS_TABLE = "comments";

// GET /api/restaurants/[id]/comments — 식당 댓글 목록 조회
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "식당 ID가 누락되었습니다." }, { status: 400 });
  }

  const { data, error } = await getSupabaseServer()
    .from(COMMENTS_TABLE)
    .select("*")
    .eq("restaurant_id", id)
    .order("created_at", { ascending: true }); // 오래된 순(연대순) 정렬

  if (error) {
    console.error("[GET /api/restaurants/[id]/comments]", error.message);
    return NextResponse.json({ error: "댓글 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/restaurants/[id]/comments — 식당 댓글 작성
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "식당 ID가 누락되었습니다." }, { status: 400 });
  }

  let body: { author?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const author = typeof body.author === "string" ? body.author.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!author) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
  }

  const row = {
    restaurant_id: id,
    author,
    content,
  };

  const { data, error } = await getSupabaseServer()
    .from(COMMENTS_TABLE)
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("[POST /api/restaurants/[id]/comments]", error.message);
    return NextResponse.json({ error: "댓글을 등록하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
