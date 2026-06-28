"use client";

import { useEffect, useState, useRef } from "react";
import { type Restaurant, type Comment, type Category, CATEGORIES, CATEGORY_COLORS } from "@/lib/types";

interface DetailPanelProps {
  restaurant: Restaurant;
  onClose: () => void;
  onRecommend: (id: string, newCount: number) => void;
  onUpdate: (updated: Restaurant) => void;
  onDelete: (id: string) => void;
}

export default function DetailPanel({
  restaurant,
  onClose,
  onRecommend,
  onUpdate,
  onDelete,
}: DetailPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  // 로컬 스토리지에 추천 기록 저장 (중복 추천 방지)
  const [hasRecommended, setHasRecommended] = useState(false);
  const [recommending, setRecommending] = useState(false);

  // 식당 수정 상태
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [editName, setEditName] = useState(restaurant.name);
  const [editCategory, setEditCategory] = useState(restaurant.category);
  const [editAddress, setEditAddress] = useState(restaurant.address || "");
  const [editRoadAddress, setEditRoadAddress] = useState(restaurant.road_address || "");
  const [editMemo, setEditMemo] = useState(restaurant.memo || "");
  const [editPlaceUrl, setEditPlaceUrl] = useState(restaurant.place_url || "");
  const [updatingRestaurant, setUpdatingRestaurant] = useState(false);
  const [deletingRestaurant, setDeletingRestaurant] = useState(false);

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentAuthor, setEditCommentAuthor] = useState("");
  const [editCommentContent, setEditCommentContent] = useState("");
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 식당 변경 시 댓글 조회 및 추천 여부 확인, 수정 폼 초기화
  useEffect(() => {
    if (!restaurant.id) return;

    // 추천 기록 확인
    const recommendedList = JSON.parse(localStorage.getItem("recommended_restaurants") || "[]");
    setHasRecommended(recommendedList.includes(restaurant.id));

    // 수정 폼 상태 초기화
    setIsEditingRestaurant(false);
    setEditName(restaurant.name);
    setEditCategory(restaurant.category);
    setEditAddress(restaurant.address || "");
    setEditRoadAddress(restaurant.road_address || "");
    setEditMemo(restaurant.memo || "");
    setEditPlaceUrl(restaurant.place_url || "");

    // 댓글 수정 상태 초기화
    setEditingCommentId(null);

    // 댓글 조회
    setLoadingComments(true);
    setCommentError("");
    fetch(`/api/restaurants/${restaurant.id}/comments`)
      .then((res) => {
        if (!res.ok) throw new Error("댓글을 불러오는 데 실패했습니다.");
        return res.json();
      })
      .then((data) => {
        setComments(data);
      })
      .catch((err) => {
        console.error(err);
        setCommentError("댓글을 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoadingComments(false);
      });
  }, [restaurant]);

  // 댓글 추가 시 스크롤 최하단 이동
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // 추천하기/취소하기 버튼 클릭
  const handleRecommendClick = async () => {
    if (recommending) return;

    setRecommending(true);
    const undo = hasRecommended;

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ undo }),
      });
      if (!res.ok) throw new Error(undo ? "추천 취소에 실패했습니다." : "추천에 실패했습니다.");

      const updatedRest: Restaurant = await res.json();
      const newCount = updatedRest.recommend_count ?? 0;

      // 상태 업데이트
      onRecommend(restaurant.id, newCount);
      setHasRecommended(!undo);

      // 로컬 스토리지 업데이트
      const recommendedList = JSON.parse(localStorage.getItem("recommended_restaurants") || "[]");
      if (undo) {
        const filtered = recommendedList.filter((id: string) => id !== restaurant.id);
        localStorage.setItem("recommended_restaurants", JSON.stringify(filtered));
      } else {
        recommendedList.push(restaurant.id);
        localStorage.setItem("recommended_restaurants", JSON.stringify(recommendedList));
      }
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
      console.error(err);
    } finally {
      setRecommending(false);
    }
  };

  // 댓글 제출
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: author.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "댓글 등록 실패");
      }

      const newComment: Comment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setContent("");
    } catch (err: any) {
      alert(err.message || "댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // 식당 수정 처리
  const handleRestaurantUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || updatingRestaurant) return;

    setUpdatingRestaurant(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          category: editCategory,
          address: editAddress.trim(),
          road_address: editRoadAddress.trim(),
          memo: editMemo.trim(),
          place_url: editPlaceUrl.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "식당 수정 실패");
      }

      const updatedRest: Restaurant = await res.json();
      onUpdate(updatedRest);
      setIsEditingRestaurant(false);
    } catch (err: any) {
      alert(err.message || "식당 수정 중 오류가 발생했습니다.");
    } finally {
      setUpdatingRestaurant(false);
    }
  };

  // 식당 삭제 처리
  const handleRestaurantDelete = async () => {
    if (deletingRestaurant) return;
    if (!window.confirm("이 식당을 정말 삭제하시겠습니까? 등록된 댓글도 함께 삭제됩니다.")) return;

    setDeletingRestaurant(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "식당 삭제 실패");
      }

      onDelete(restaurant.id);
      onClose();
    } catch (err: any) {
      alert(err.message || "식당 삭제 중 오류가 발생했습니다.");
      setDeletingRestaurant(false);
    }
  };

  // 댓글 수정 모드 진입
  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentAuthor(comment.author);
    setEditCommentContent(comment.content);
  };

  // 댓글 수정 저장
  const handleCommentUpdate = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editCommentAuthor.trim() || !editCommentContent.trim() || savingCommentId) return;

    setSavingCommentId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: editCommentAuthor.trim(),
          content: editCommentContent.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "댓글 수정 실패");
      }

      const updatedComment: Comment = await res.json();
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updatedComment : c))
      );
      setEditingCommentId(null);
    } catch (err: any) {
      alert(err.message || "댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setSavingCommentId(null);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm("이 댓글을 정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "댓글 삭제 실패");
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || "댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  const color = CATEGORY_COLORS[restaurant.category];
  const roadAddress = restaurant.road_address || restaurant.address;

  // 작성일자 포맷팅 함수
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "방금 전";
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;

      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // 식당 수정 UI
  if (isEditingRestaurant) {
    return (
      <div className="detail-panel">
        <header className="detail-header">
          <div className="title-row">
            <h2>식당 정보 수정</h2>
            <button className="close-btn" onClick={() => setIsEditingRestaurant(false)} aria-label="취소">
              &times;
            </button>
          </div>
        </header>

        <div className="detail-content">
          <form className="edit-restaurant-form" onSubmit={handleRestaurantUpdate}>
            <label className="field">
              <span>식당 이름</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
                required
              />
            </label>

            <label className="field">
              <span>카테고리</span>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>도로명 주소</span>
              <input
                type="text"
                value={editRoadAddress}
                onChange={(e) => setEditRoadAddress(e.target.value)}
                placeholder="예: 서울 종로구 종로3길 24-17"
              />
            </label>

            <label className="field">
              <span>지번 주소</span>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="예: 서울 종로구 청진동 179-1"
              />
            </label>

            <label className="field">
              <span>메모</span>
              <input
                type="text"
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                placeholder="예: 점심 웨이팅 길어요"
              />
            </label>

            <label className="field">
              <span>카카오맵 URL</span>
              <input
                type="text"
                value={editPlaceUrl}
                onChange={(e) => setEditPlaceUrl(e.target.value)}
                placeholder="예: http://place.map.kakao.com/171538590"
              />
            </label>

            <div className="edit-actions">
              <button
                type="submit"
                className="save-btn"
                disabled={updatingRestaurant || !editName.trim()}
              >
                {updatingRestaurant ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsEditingRestaurant(false)}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 일반 식당 보기 UI
  return (
    <div className="detail-panel">
      {/* 헤더 */}
      <header className="detail-header">
        <div className="title-area">
          <div className="title-row">
            <h2>{restaurant.name}</h2>
            <button className="close-btn" onClick={onClose} aria-label="닫기">
              &times;
            </button>
          </div>
          <span className="cat-badge" style={{ backgroundColor: color }}>
            {restaurant.category}
          </span>
        </div>
      </header>

      <div className="detail-content">
        {/* 식당 기본 정보 */}
        <section className="info-section">
          {roadAddress && (
            <div className="info-row">
              <span className="info-icon">📍</span>
              <div className="info-text">
                <div className="address-main">{roadAddress}</div>
                {restaurant.road_address && restaurant.address && (
                  <div className="address-sub">(지번) {restaurant.address}</div>
                )}
              </div>
            </div>
          )}

          {restaurant.memo && (
            <div className="info-row">
              <span className="info-icon">📝</span>
              <div className="info-text font-memo">{restaurant.memo}</div>
            </div>
          )}

          {restaurant.place_url && (
            <div className="info-row">
              <span className="info-icon">🔗</span>
              <div className="info-text">
                <a
                  href={restaurant.place_url}
                  target="_blank"
                  rel="noreferrer"
                  className="link-map"
                >
                  카카오맵 상세 정보 보기
                </a>
              </div>
            </div>
          )}

          {/* 식당 수정/삭제 버튼 */}
          <div className="restaurant-actions">
            <button className="rest-edit-btn" onClick={() => setIsEditingRestaurant(true)}>
              ✏️ 식당 수정
            </button>
            <button
              className="rest-delete-btn"
              onClick={handleRestaurantDelete}
              disabled={deletingRestaurant}
            >
              🗑️ 식당 삭제
            </button>
          </div>
        </section>

        {/* 추천 섹션 */}
        <section className="recommend-section">
          <div className="recommend-info">
            <span className="heart-icon">👍</span>
            <span className="recommend-text">
              현재 <strong>{restaurant.recommend_count ?? 0}명</strong>이 이 식당을 추천했습니다.
            </span>
          </div>
          <button
            className={`recommend-action-btn ${hasRecommended ? "recommended" : ""}`}
            onClick={handleRecommendClick}
            disabled={recommending}
          >
            {hasRecommended ? "👍 추천 취소하기" : recommending ? "추천 중..." : "👍 맛집으로 추천하기"}
          </button>
        </section>

        {/* 댓글(리뷰) 섹션 */}
        <section className="reviews-section">
          <h3>💬 댓글 및 후기 <span className="review-count">({comments.length})</span></h3>

          <div className="comment-list">
            {loadingComments && <p className="comment-muted">댓글 불러오는 중...</p>}
            {!loadingComments && comments.length === 0 && (
              <p className="comment-muted">첫 댓글을 달아보세요! 이 맛집에 대한 후기를 공유해주세요.</p>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                {editingCommentId === comment.id ? (
                  /* 댓글 수정 폼 */
                  <form
                    className="comment-edit-form"
                    onSubmit={(e) => handleCommentUpdate(e, comment.id)}
                  >
                    <input
                      type="text"
                      value={editCommentAuthor}
                      onChange={(e) => setEditCommentAuthor(e.target.value)}
                      maxLength={20}
                      required
                      placeholder="닉네임"
                    />
                    <textarea
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      maxLength={300}
                      required
                      placeholder="댓글 내용을 입력해주세요."
                    />
                    <div className="comment-edit-actions">
                      <button
                        type="submit"
                        className="comment-save-btn"
                        disabled={savingCommentId === comment.id || !editCommentAuthor.trim() || !editCommentContent.trim()}
                      >
                        {savingCommentId === comment.id ? "저장 중..." : "저장"}
                      </button>
                      <button
                        type="button"
                        className="comment-cancel-btn"
                        onClick={() => setEditingCommentId(null)}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  /* 일반 댓글 보기 */
                  <>
                    <div className="comment-meta">
                      <span className="comment-author">{comment.author}</span>
                      <div className="comment-right">
                        <span className="comment-time">{formatTime(comment.created_at)}</span>
                        <div className="comment-actions">
                          <button
                            type="button"
                            className="comment-action-link"
                            onClick={() => startEditComment(comment)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="comment-action-link delete"
                            onClick={() => handleCommentDelete(comment.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="comment-body">{comment.content}</div>
                  </>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* 댓글 작성 폼 */}
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <div className="form-row">
              <input
                type="text"
                placeholder="닉네임 (예: 홍길동)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={20}
                required
              />
            </div>
            <div className="form-row">
              <textarea
                placeholder="댓글과 솔직한 후기를 남겨주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={300}
                required
              />
            </div>
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={submittingComment || !author.trim() || !content.trim()}
            >
              {submittingComment ? "등록 중..." : "댓글 등록"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
