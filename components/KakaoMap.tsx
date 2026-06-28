"use client";

import { useEffect, useRef } from "react";
import { useKakaoLoader } from "@/lib/useKakaoLoader";
import { getMarkerImage } from "@/lib/markerImage";
import { CATEGORY_COLORS, type Restaurant } from "@/lib/types";

interface KakaoMapProps {
  restaurants: Restaurant[];
  // 사이드바에서 선택해 포커스할 식당 (지도 중심 이동)
  focusId: string | null;
  // KT광화문빌딩(기준점) 좌표
  center: { lat: number; lng: number };
  // KT광화문빌딩(기준점) 이름 — 기준 마커 라벨에 사용
  centerName?: string;
  onSelect?: (id: string) => void;
}

export default function KakaoMap({
  restaurants,
  focusId,
  center,
  centerName = "KT광화문빌딩",
  onSelect,
}: KakaoMapProps) {
  const { loaded, error } = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, kakao.maps.Marker>>(new Map());
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;

    mapRef.current = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 4,
    });
    infoWindowRef.current = new window.kakao.maps.InfoWindow({ content: "", removable: true });

    // KT광화문빌딩 위치 표시 (기본 마커)
    new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(center.lat, center.lng),
      title: centerName,
      map: mapRef.current,
    });
  }, [loaded, center.lat, center.lng, centerName]);

  // 컨테이너 크기 변경 시 지도 다시 그리기 (사이드바 접기/펼치기·창 크기 변경 대응)
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    const map = mapRef.current;
    if (!map) return;

    const observer = new ResizeObserver(() => {
      const c = map.getCenter();
      map.relayout(); // 늘어난 영역 타일 렌더링
      map.setCenter(c); // 중심 유지
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loaded]);

  // 식당 마커 렌더링 (목록 변경 시 갱신)
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = mapRef.current;
    const markers = markersRef.current;

    const nextIds = new Set(restaurants.map((r) => r.id));

    // 사라진 마커 제거
    for (const [id, marker] of markers) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        markers.delete(id);
      }
    }

    // 새로 추가된 마커 생성
    for (const r of restaurants) {
      if (markers.has(r.id)) continue;

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(r.lat, r.lng),
        image: getMarkerImage(r.category),
        title: r.name,
      });
      marker.setMap(map);

      window.kakao.maps.event.addListener(marker, "click", () => {
        openInfoWindow(r, marker);
        if (onSelect) onSelect(r.id);
      });

      markers.set(r.id, marker);
    }
  }, [loaded, restaurants]);

  // 사이드바에서 식당 선택 시 지도 이동 + 인포윈도우
  useEffect(() => {
    if (!loaded || !mapRef.current || !focusId) return;
    const target = restaurants.find((r) => r.id === focusId);
    const marker = markersRef.current.get(focusId);
    if (!target || !marker) return;

    mapRef.current.panTo(new window.kakao.maps.LatLng(target.lat, target.lng));
    openInfoWindow(target, marker);
  }, [loaded, focusId, restaurants]);

  function openInfoWindow(r: Restaurant, marker: kakao.maps.Marker) {
    if (!infoWindowRef.current || !mapRef.current) return;
    const color = CATEGORY_COLORS[r.category];
    const linkHtml = r.place_url
      ? `<a href="${r.place_url}" target="_blank" rel="noreferrer" style="color:#1971c2;font-size:12px;">카카오맵에서 보기 →</a>`
      : "";
    const memoHtml = r.memo
      ? `<div style="font-size:12px;color:#495057;margin-top:4px;">${escapeHtml(r.memo)}</div>`
      : "";
    const addr = r.road_address || r.address || "";

    infoWindowRef.current.close(); // 이전 인포윈도우 닫기
    infoWindowRef.current = new window.kakao.maps.InfoWindow({
      removable: true,
      content: `
        <div style="padding:10px 12px;min-width:160px;max-width:240px;font-family:sans-serif;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};"></span>
            <strong style="font-size:14px;">${escapeHtml(r.name)}</strong>
          </div>
          <div style="font-size:11px;color:${color};margin-top:2px;">${r.category}</div>
          ${addr ? `<div style="font-size:12px;color:#868e96;margin-top:4px;">${escapeHtml(addr)}</div>` : ""}
          ${memoHtml}
          <div style="margin-top:6px;">${linkHtml}</div>
        </div>`,
    });
    infoWindowRef.current.open(mapRef.current, marker);
  }

  if (error) {
    return (
      <div className="map-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="map-wrap">
      {!loaded && <div className="map-loading">지도를 불러오는 중…</div>}
      <div ref={containerRef} className="map-container" />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
