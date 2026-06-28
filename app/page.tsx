"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import KakaoMap from "@/components/KakaoMap";
import Sidebar from "@/components/Sidebar";
import AddRestaurantForm from "@/components/AddRestaurantForm";
import DetailPanel from "@/components/DetailPanel";
import { COMPANY_CENTER, COMPANY_NAME } from "@/lib/config";
import type { Category, Restaurant } from "@/lib/types";

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "전체">("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 식당 목록 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/restaurants");
        if (!res.ok) throw new Error();
        const data: Restaurant[] = await res.json();
        if (!cancelled) setRestaurants(data);
      } catch {
        // 목록 로드 실패는 빈 목록으로 처리
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 지도에 표시할 식당 (카테고리 필터 적용)
  const visibleRestaurants = useMemo(
    () =>
      activeCategory === "전체"
        ? restaurants
        : restaurants.filter((r) => r.category === activeCategory),
    [restaurants, activeCategory]
  );

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || null,
    [restaurants, selectedId]
  );

  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  const handleAdded = useCallback((r: Restaurant) => {
    setRestaurants((prev) => [r, ...prev]);
    setSelectedId(r.id);
  }, []);

  const handleRecommend = useCallback((id: string, newCount: number) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, recommend_count: newCount } : r))
    );
  }, []);

  const handleUpdate = useCallback((updated: Restaurant) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    setSelectedId(null);
  }, []);

  return (
    <main className={`app ${sidebarOpen ? "" : "sidebar-hidden"}`}>
      <Sidebar
        restaurants={restaurants}
        loading={loading}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onSelect={handleSelect}
        onAddClick={() => setShowAddForm(true)}
        selectedId={selectedId}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      {!sidebarOpen && (
        <button
          className="sidebar-open-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="목록 열기"
        >
          목록 <span className="arrow-icon">»</span>
        </button>
      )}

      {selectedRestaurant && (
        <DetailPanel
          restaurant={selectedRestaurant}
          onClose={() => setSelectedId(null)}
          onRecommend={handleRecommend}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      <KakaoMap
        restaurants={visibleRestaurants}
        focusId={selectedId}
        center={COMPANY_CENTER}
        centerName={COMPANY_NAME}
        onSelect={handleSelect}
      />

      {showAddForm && (
        <AddRestaurantForm onClose={() => setShowAddForm(false)} onAdded={handleAdded} />
      )}
    </main>
  );
}
