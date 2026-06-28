"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { CATEGORIES, CATEGORY_COLORS, type Category, type Restaurant } from "@/lib/types";

interface SidebarProps {
  restaurants: Restaurant[];
  loading: boolean;
  activeCategory: Category | "전체";
  onCategoryChange: (c: Category | "전체") => void;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  selectedId: string | null;
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  restaurants,
  loading,
  activeCategory,
  onCategoryChange,
  onSelect,
  onAddClick,
  selectedId,
  open,
  onToggle,
}: SidebarProps) {
  // ===== 모바일 바텀시트 (네이버 지도 스타일) =====
  const [isMobile, setIsMobile] = useState(false);
  const [sheetY, setSheetY] = useState(0); // translateY(px), 클수록 아래로 내려감
  const [dragging, setDragging] = useState(false);
  const snapRef = useRef({ full: 0, half: 0, peek: 0 });
  const dragRef = useRef({ startTouchY: 0, startSheetY: 0 });

  // 뷰포트 기준 스냅 지점 계산
  const computeSnaps = useCallback(() => {
    const vh = window.innerHeight;
    const sheetH = vh * 0.88; // 시트 전체 높이(CSS와 일치)
    const snaps = {
      full: 0, // 거의 전체 펼침
      half: Math.round(sheetH - vh * 0.45), // 기본: 약 45% 노출
      peek: Math.round(sheetH - 72), // 핸들만 살짝 노출
    };
    snapRef.current = snaps;
    return snaps;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (mq.matches) setSheetY((prev) => (prev === 0 ? computeSnaps().half : prev));
    };
    apply();
    const onResize = () => computeSnaps();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", onResize);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", onResize);
    };
  }, [computeSnaps]);

  const onHandleTouchStart = (e: ReactTouchEvent) => {
    if (!isMobile) return;
    dragRef.current = { startTouchY: e.touches[0].clientY, startSheetY: sheetY };
    setDragging(true);
  };
  const onHandleTouchMove = (e: ReactTouchEvent) => {
    if (!isMobile) return;
    const { full, peek } = snapRef.current;
    const dy = e.touches[0].clientY - dragRef.current.startTouchY;
    const y = Math.max(full, Math.min(peek, dragRef.current.startSheetY + dy));
    setSheetY(y);
  };
  const onHandleTouchEnd = () => {
    if (!isMobile) return;
    setDragging(false);
    const { full, half, peek } = snapRef.current;
    const moved = Math.abs(sheetY - dragRef.current.startSheetY);
    let target: number;
    if (moved < 6) {
      // 탭: 더 펼치는 방향으로 순환 (peek → half → full → peek)
      if (sheetY >= peek - 1) target = half;
      else if (sheetY <= full + 1) target = peek;
      else target = full;
    } else {
      // 드래그: 가장 가까운 스냅 지점으로
      target = [full, half, peek].reduce((a, b) =>
        Math.abs(b - sheetY) < Math.abs(a - sheetY) ? b : a
      );
    }
    setSheetY(target);
  };

  const sheetStyle: CSSProperties | undefined = isMobile
    ? { transform: `translateY(${sheetY}px)`, transition: dragging ? "none" : undefined }
    : undefined;

  // 카테고리별 그룹핑
  const grouped = useMemo(() => {
    const map = new Map<Category, Restaurant[]>();
    for (const c of CATEGORIES) map.set(c, []);
    for (const r of restaurants) map.get(r.category)?.push(r);
    return map;
  }, [restaurants]);

  const visibleCategories =
    activeCategory === "전체" ? CATEGORIES : CATEGORIES.filter((c) => c === activeCategory);

  return (
    <aside className={`sidebar ${open ? "" : "sidebar-collapsed"}`} style={sheetStyle}>
      <div
        className="sheet-handle"
        onTouchStart={onHandleTouchStart}
        onTouchMove={onHandleTouchMove}
        onTouchEnd={onHandleTouchEnd}
      >
        <span className="sheet-handle-bar" />
      </div>
      <header className="sidebar-header">
        <h1>🍴 광화문EAST 맛집 지도</h1>
        <div className="sidebar-header-actions">
          <button className="add-btn" onClick={onAddClick}>
            + 식당 추가
          </button>
          <button
            className="collapse-btn"
            onClick={onToggle}
            aria-label="목록 접기"
            title="목록 접기"
          >
            <span className="arrow-icon">«</span>
          </button>
        </div>
      </header>

      <div className="filter-row">
        <button
          className={`chip ${activeCategory === "전체" ? "chip-active" : ""}`}
          onClick={() => onCategoryChange("전체")}
        >
          전체 <span className="chip-count">{restaurants.length}</span>
        </button>
        {CATEGORIES.map((c) => {
          const count = grouped.get(c)?.length ?? 0;
          return (
            <button
              key={c}
              className={`chip ${activeCategory === c ? "chip-active" : ""}`}
              style={
                activeCategory === c ? { background: CATEGORY_COLORS[c], borderColor: CATEGORY_COLORS[c] } : undefined
              }
              onClick={() => onCategoryChange(c)}
            >
              {c} <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="list-scroll">
        {loading && <p className="muted">불러오는 중…</p>}
        {!loading && restaurants.length === 0 && (
          <p className="muted">아직 등록된 식당이 없어요. “+ 식당 추가”로 첫 맛집을 등록해보세요!</p>
        )}

        {!loading &&
          visibleCategories.map((c) => {
            const items = grouped.get(c) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={c} className="cat-group">
                <h2 className="cat-title">
                  <span className="dot" style={{ background: CATEGORY_COLORS[c] }} />
                  {c} <span className="muted">({items.length})</span>
                </h2>
                <ul>
                  {items.map((r) => (
                    <li
                      key={r.id}
                      className={`rest-item ${selectedId === r.id ? "rest-item-active" : ""}`}
                      onClick={() => onSelect(r.id)}
                    >
                      <div className="rest-name">
                        {r.name}
                        {r.recommend_count !== undefined && r.recommend_count > 0 && (
                          <span className="rest-recommend-badge">👍 {r.recommend_count}</span>
                        )}
                      </div>
                      {(r.road_address || r.address) && (
                        <div className="rest-addr">{r.road_address || r.address}</div>
                      )}
                      {r.memo && <div className="rest-memo">{r.memo}</div>}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
      </div>
      <div className="sidebar-footer">
        Made by AX운영혁신팀
      </div>
    </aside>
  );
}
