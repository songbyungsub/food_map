export interface Restaurant {
  id: string;
  name: string;
  category: Category;
  address: string | null;
  road_address: string | null;
  lat: number;
  lng: number;
  memo: string | null;
  place_url: string | null;
  created_at: string;
  recommend_count?: number; // 추천수
}

export interface Comment {
  id: string;
  restaurant_id: string;
  author: string;
  content: string;
  created_at: string;
}

// 새 식당 추가 시 클라이언트가 보내는 형태 (서버에서 id/created_at/recommend_count 생성)
export type NewRestaurant = Omit<Restaurant, "id" | "created_at" | "recommend_count">;

export const CATEGORIES = [
  "한식",
  "중식",
  "일식",
  "양식",
  "분식",
  "카페/디저트",
  "술집",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

// 카테고리별 마커/리스트 색상
export const CATEGORY_COLORS: Record<Category, string> = {
  한식: "#e8590c",
  중식: "#c92a2a",
  일식: "#1971c2",
  양식: "#2f9e44",
  분식: "#d6336c",
  "카페/디저트": "#9c36b5",
  술집: "#f08c00",
  기타: "#495057",
};

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
