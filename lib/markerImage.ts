import { CATEGORY_COLORS, type Category } from "@/lib/types";

// 카테고리 색상으로 칠한 핀 모양 SVG 마커 이미지를 생성한다.
// 같은 색은 한 번만 만들어 캐싱한다.
const cache = new Map<string, kakao.maps.MarkerImage>();

export function getMarkerImage(category: Category): kakao.maps.MarkerImage {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["기타"];
  const cached = cache.get(color);
  if (cached) return cached;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.2 0 0 7 0 15.7 0 27 16 40 16 40s16-13 16-24.3C32 7 24.8 0 16 0z" fill="${color}"/>
      <circle cx="16" cy="15.5" r="6" fill="#fff"/>
    </svg>`;

  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const image = new window.kakao.maps.MarkerImage(
    src,
    new window.kakao.maps.Size(32, 40),
    { offset: new window.kakao.maps.Point(16, 40) }
  );

  cache.set(color, image);
  return image;
}
