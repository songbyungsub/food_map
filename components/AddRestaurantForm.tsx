"use client";

import { useRef, useState } from "react";
import { CATEGORIES, type Category, type NewRestaurant, type Restaurant } from "@/lib/types";

interface AddRestaurantFormProps {
  onClose: () => void;
  onAdded: (r: Restaurant) => void;
}

// 카카오 카테고리 그룹 코드 → 우리 카테고리 추정
function guessCategory(categoryName: string): Category {
  const c = categoryName;
  if (c.includes("일식") || c.includes("초밥") || c.includes("회")) return "일식";
  if (c.includes("중식") || c.includes("중국")) return "중식";
  if (c.includes("양식") || c.includes("이탈리") || c.includes("피자") || c.includes("스테이크"))
    return "양식";
  if (c.includes("분식")) return "분식";
  if (c.includes("카페") || c.includes("디저트") || c.includes("베이커리")) return "카페/디저트";
  if (c.includes("술집") || c.includes("호프") || c.includes("주점") || c.includes("바")) return "술집";
  if (c.includes("한식") || c.includes("국밥") || c.includes("찌개") || c.includes("고기"))
    return "한식";
  return "기타";
}

interface SelectedPlace {
  name: string;
  address: string;
  road_address: string;
  lat: number;
  lng: number;
  place_url: string;
}

export default function AddRestaurantForm({ onClose, onAdded }: AddRestaurantFormProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<kakao.maps.services.PlacesSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);

  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [category, setCategory] = useState<Category>("한식");
  const [memo, setMemo] = useState("");
  const [topMenu, setTopMenu] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placesRef = useRef<kakao.maps.services.Places | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    if (!window.kakao?.maps?.services) {
      setSearchMsg("지도 검색 모듈이 아직 준비되지 않았습니다.");
      return;
    }
    setSearching(true);
    setSearchMsg(null);
    setResults([]);

    if (!placesRef.current) placesRef.current = new window.kakao.maps.services.Places();

    placesRef.current.keywordSearch(keyword.trim(), (data, status) => {
      setSearching(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setResults(data);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        setSearchMsg("검색 결과가 없습니다.");
      } else {
        setSearchMsg("검색 중 오류가 발생했습니다.");
      }
    });
  }

  function pickPlace(p: kakao.maps.services.PlacesSearchResult) {
    setSelected({
      name: p.place_name,
      address: p.address_name,
      road_address: p.road_address_name,
      lat: Number(p.y),
      lng: Number(p.x),
      place_url: p.place_url,
    });
    setCategory(guessCategory(p.category_name));
  }

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    const payload: NewRestaurant = {
      name: selected.name,
      category,
      address: selected.address || null,
      road_address: selected.road_address || null,
      lat: selected.lat,
      lng: selected.lng,
      memo: memo.trim() || null,
      place_url: selected.place_url || null,
      top_menu: topMenu.trim() || null,
    };

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "추가에 실패했습니다.");
        return;
      }
      onAdded(data as Restaurant);
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>식당 추가</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="식당 이름으로 검색 (예: 광화문 국밥)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={searching}>
            {searching ? "검색 중…" : "검색"}
          </button>
        </form>

        {searchMsg && <p className="muted small">{searchMsg}</p>}

        {results.length > 0 && (
          <ul className="search-results">
            {results.map((p) => (
              <li
                key={p.id}
                className={selected?.place_url === p.place_url ? "result-active" : ""}
                onClick={() => pickPlace(p)}
              >
                <strong>{p.place_name}</strong>
                <span className="muted small">{p.category_name}</span>
                <span className="muted small">{p.road_address_name || p.address_name}</span>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <div className="selected-panel">
            <div className="selected-name">📍 {selected.name}</div>
            <label className="field">
              <span>카테고리</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>대표 메뉴 (선택)</span>
              <input
                type="text"
                placeholder="예: 우육면, 특선 초밥"
                value={topMenu}
                onChange={(e) => setTopMenu(e.target.value)}
              />
            </label>
            <label className="field">
              <span>메모 (선택)</span>
              <input
                type="text"
                placeholder="예: 점심 웨이팅 길어요, 대표메뉴 추천"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </label>

            {error && <p className="error-msg">{error}</p>}

            <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "추가 중…" : "이 식당 추가하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
