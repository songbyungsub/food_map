"use client";

import { useMemo } from "react";
import { CATEGORIES, CATEGORY_COLORS, type Category, type Restaurant } from "@/lib/types";

interface SidebarProps {
  restaurants: Restaurant[];
  loading: boolean;
  activeCategory: Category | "전체";
  onCategoryChange: (c: Category | "전체") => void;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  selectedId: string | null;
}

export default function Sidebar({
  restaurants,
  loading,
  activeCategory,
  onCategoryChange,
  onSelect,
  onAddClick,
  selectedId,
}: SidebarProps) {
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
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>🍴 광화문EAST 맛집 지도</h1>
        <button className="add-btn" onClick={onAddClick}>
          + 식당 추가
        </button>
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
    </aside>
  );
}
