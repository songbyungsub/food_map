"use client";

import { useEffect, useState } from "react";

const SDK_ID = "kakao-maps-sdk";

let loadPromise: Promise<void> | null = null;

function loadKakaoSdk(appKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.kakao?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;

    const onLoad = () => window.kakao.maps.load(() => resolve());

    if (existing) {
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", () => reject(new Error("Kakao SDK load error")));
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_ID;
    script.async = true;
    // services 라이브러리: 장소 검색에 필요
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener("load", onLoad);
    script.addEventListener("error", () => reject(new Error("Kakao SDK load error")));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** 카카오맵 SDK 로드 상태를 반환하는 훅 */
export function useKakaoLoader(): { loaded: boolean; error: string | null } {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) {
      setError("NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다.");
      return;
    }

    let cancelled = false;
    loadKakaoSdk(appKey)
      .then(() => !cancelled && setLoaded(true))
      .catch(() => !cancelled && setError("카카오맵을 불러오지 못했습니다. 키와 도메인 설정을 확인하세요."));

    return () => {
      cancelled = true;
    };
  }, []);

  return { loaded, error };
}
