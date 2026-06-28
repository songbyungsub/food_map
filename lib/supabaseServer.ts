import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 서버 전용 Supabase 클라이언트.
// service_role 키는 RLS를 우회하므로 절대 클라이언트로 노출하면 안 됩니다.
// (이 파일은 API 라우트 등 서버 환경에서만 import 됩니다.)
//
// 환경변수 검증은 import 시점이 아니라 실제 사용 시점(getSupabaseServer 호출)에
// 합니다. 이렇게 해야 .env.local 이 없는 빌드 단계에서 모듈 로드만으로 빌드가
// 깨지지 않습니다.

let client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다. .env.local 을 확인하세요."
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return client;
}

export const RESTAURANTS_TABLE = "restaurants";
