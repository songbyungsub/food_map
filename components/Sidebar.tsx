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
  const dragRef = useRef({
    startTouchY: 0,
    startSheetY: 0,
    active: false,
    lastTouchY: 0,
    lastTime: 0,
    vy: 0, // 세로 속도(px/ms), 음수 = 위로
  });

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
    // 버튼(추가 등) 탭은 드래그로 가로채지 않음
    if ((e.target as HTMLElement).closest("button")) return;
    const y = e.touches[0].clientY;
    dragRef.current = {
      startTouchY: y,
      startSheetY: sheetY,
      active: true,
      lastTouchY: y,
      lastTime: e.timeStamp,
      vy: 0,
    };
    setDragging(true);
  };
  const onHandleTouchMove = (e: ReactTouchEvent) => {
    if (!isMobile || !dragRef.current.active) return;
    const { full, peek } = snapRef.current;
    const clientY = e.touches[0].clientY;
    // 속도 추적 (직전 이동 기준)
    const dt = e.timeStamp - dragRef.current.lastTime;
    if (dt > 0) dragRef.current.vy = (clientY - dragRef.current.lastTouchY) / dt;
    dragRef.current.lastTouchY = clientY;
    dragRef.current.lastTime = e.timeStamp;

    const dy = clientY - dragRef.current.startTouchY;
    const y = Math.max(full, Math.min(peek, dragRef.current.startSheetY + dy));
    setSheetY(y);
  };
  const onHandleTouchEnd = () => {
    if (!isMobile || !dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);

    const { full, half, peek } = snapRef.current;
    const order = [peek, half, full]; // Y 내림차순: 위 인덱스일수록 더 펼침
    const nearestIdx = (y: number) =>
      order.reduce((best, v, i) => (Math.abs(v - y) < Math.abs(order[best] - y) ? i : best), 0);

    const startIdx = nearestIdx(dragRef.current.startSheetY);
    const moved = dragRef.current.startSheetY - sheetY; // 위로 이동량(+)
    const vy = dragRef.current.vy; // 음수 = 위로
    const FLICK = 0.3; // px/ms: 이 속도 넘으면 살짝만 움직여도 플릭으로 인식
    const STEP = 28; // px: 천천히 끌어도 이만큼 이동하면 한 단계

    let idx: number;
    if (Math.abs(moved) < 6 && Math.abs(vy) < 0.05) {
      // 탭: 한 단계 펼치고 full에서 다시 peek로 순환
      idx = startIdx >= order.length - 1 ? 0 : startIdx + 1;
    } else if (vy < -FLICK) {
      idx = order.length - 1; // 위로 살짝 쓸어올리면 곧장 전체(full)로
    } else if (vy > FLICK) {
      idx = 0; // 아래로 살짝 쓸어내리면 곧장 최소(peek)로
    } else if (moved > STEP) {
      idx = Math.min(order.length - 1, startIdx + 1); // 천천히 위로 끌면 한 단계
    } else if (moved < -STEP) {
      idx = Math.max(0, startIdx - 1); // 천천히 아래로 끌면 한 단계
    } else {
      idx = nearestIdx(sheetY);
    }
    setSheetY(order[idx]);
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
        className="sheet-grab"
        onTouchStart={onHandleTouchStart}
        onTouchMove={onHandleTouchMove}
        onTouchEnd={onHandleTouchEnd}
      >
        <div className="sheet-handle">
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
      </div>

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
