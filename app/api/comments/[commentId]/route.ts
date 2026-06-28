import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const COMMENTS_TABLE = "comments";

// PUT /api/comments/[commentId] — 댓글 수정
export async function PUT(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  const { commentId } = params;
  if (!commentId) {
    return NextResponse.json({ error: "댓글 ID가 누락되었습니다." }, { status: 400 });
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

  const { data, error } = await getSupabaseServer()
    .from(COMMENTS_TABLE)
    .update({ author, content })
    .eq("id", commentId)
    .select("*")
    .single();

  if (error) {
    console.error("[PUT /api/comments/[commentId]]", error.message);
    return NextResponse.json({ error: "댓글 수정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/comments/[commentId] — 댓글 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  const { commentId } = params;
  if (!commentId) {
    return NextResponse.json({ error: "댓글 ID가 누락되었습니다." }, { status: 400 });
  }

  const { error } = await getSupabaseServer()
    .from(COMMENTS_TABLE)
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("[DELETE /api/comments/[commentId]]", error.message);
    return NextResponse.json({ error: "댓글 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
