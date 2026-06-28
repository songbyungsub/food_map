import { CATEGORY_COLORS, type Category } from "@/lib/types";

// 카테고리별 색상 핀 + 이모지 아이콘으로 마커 이미지를 생성한다.
// 카테고리별로 한 번만 만들어 캐싱한다.
const cache = new Map<Category, kakao.maps.MarkerImage>();

// 카테고리별 대표 이모지
const CATEGORY_EMOJI: Record<Category, string> = {
  한식: "🍚",
  중식: "🥟",
  일식: "🍣",
  양식: "🍝",
  분식: "🍢",
  "카페/디저트": "☕",
  술집: "🍺",
  기타: "🍴",
};

const W = 36;
const H = 46;

export function getMarkerImage(category: Category): kakao.maps.MarkerImage {
  const cached = cache.get(category);
  if (cached) return cached;

  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["기타"];
  const emoji = CATEGORY_EMOJI[category] ?? CATEGORY_EMOJI["기타"];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <path d="M18 0C8.1 0 0 8.05 0 18.055 0 31.05 18 46 18 46s18-14.95 18-27.945C36 8.05 27.9 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="17.5" r="11" fill="#fff"/>
      <text x="18" y="18.5" text-anchor="middle" dominant-baseline="central" font-size="15">${emoji}</text>
    </svg>`;

  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new window.kakao.maps.MarkerImage(
    src,
    new window.kakao.maps.Size(W, H),
    { offset: new window.kakao.maps.Point(W / 2, H) }
  );

  cache.set(category, image);
  return image;
}
