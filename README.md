# 🍴 회사 맛집 지도 (Food Map)

회사 주변 맛집을 **카테고리별로** 모아보고, 카카오맵에 마커로 표시하며,
사용자가 **직접 식당을 추가**할 수 있는 웹앱입니다.

- **프론트엔드/백엔드**: Next.js 14 (App Router)
- **지도**: 카카오맵 JavaScript SDK (+ 장소검색 services)
- **데이터베이스**: Supabase (PostgreSQL)
- **배포**: Vercel

---

## 1. 사전 준비

### Node.js 설치 (필수)

이 프로젝트는 Node.js 18 이상이 필요합니다. 설치 후 새 터미널을 여세요.

```powershell
winget install OpenJS.NodeJS.LTS
```

### 카카오 JavaScript 키

[카카오 개발자 콘솔](https://developers.kakao.com) → 내 애플리케이션 → **JavaScript 키** 사용.
**플랫폼 → Web → 사이트 도메인**에 아래를 등록하세요:

- `http://localhost:3000`
- 배포 후의 Vercel 도메인 (예: `https://your-app.vercel.app`)

### Supabase

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. **SQL Editor**에서 [`supabase/schema.sql`](supabase/schema.sql) 실행
3. **Project Settings → API**에서 `URL`과 `service_role` 키 복사

---

## 2. 로컬 실행

```powershell
# 1) 의존성 설치
npm install

# 2) 환경변수 설정
Copy-Item .env.local.example .env.local
#  그 뒤 .env.local 을 열어 실제 키 값으로 채우세요.

# 3) 개발 서버 실행
npm run dev
```

→ http://localhost:3000

### 환경변수 (`.env.local`)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오 JavaScript 키 (브라우저 노출됨) |
| `SUPABASE_URL` | Supabase 프로젝트 URL (서버 전용) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 (서버 전용, **비공개**) |
| `NEXT_PUBLIC_COMPANY_NAME` | (선택) 회사 이름 — 기준 마커 라벨. 기본 `KT광화문빌딩East` |
| `NEXT_PUBLIC_COMPANY_ADDRESS` | (선택) 회사 주소 |
| `NEXT_PUBLIC_COMPANY_LAT` | (선택) 회사 위도 — 지도 기준점. 기본 KT광화문빌딩East |
| `NEXT_PUBLIC_COMPANY_LNG` | (선택) 회사 경도 |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회하는 키입니다. 절대 `NEXT_PUBLIC_`을
> 붙이거나 클라이언트에 노출하지 마세요. 모든 DB 접근은 `/api/restaurants` 서버
> 라우트를 통해서만 이뤄집니다.

---

## 3. Vercel 배포

1. 코드를 GitHub 저장소에 push
2. [vercel.com](https://vercel.com) → New Project → 저장소 import
3. **Environment Variables**에 위 4개(+선택 2개) 변수 등록
4. Deploy
5. 배포된 도메인을 **카카오 콘솔의 사이트 도메인**에 추가

```powershell
git init
git add .
git commit -m "feat: 회사 맛집 지도 초기 버전"
# GitHub 저장소 생성 후
git remote add origin https://github.com/<you>/food-map.git
git push -u origin main
```

---

## 4. 구조

```
app/
  layout.tsx                # 루트 레이아웃
  page.tsx                  # 메인 (상태 관리: 목록/필터/선택)
  globals.css               # 전체 스타일
  api/restaurants/route.ts  # GET(목록) / POST(추가) API
components/
  KakaoMap.tsx              # 지도 + 카테고리별 색상 마커
  Sidebar.tsx               # 카테고리 필터 + 식당 리스트
  AddRestaurantForm.tsx     # 장소검색 기반 식당 추가 모달
lib/
  types.ts                  # 카테고리/타입 정의
  config.ts                 # 회사 기준 좌표
  supabaseServer.ts         # 서버 전용 Supabase 클라이언트
  useKakaoLoader.ts         # 카카오 SDK 로더 훅
  markerImage.ts            # 카테고리 색상 마커 이미지
  kakao.d.ts                # 카카오 SDK 타입 선언
supabase/
  schema.sql                # DB 테이블 스키마
```

## 5. 동작 방식

- **목록 표시**: 페이지 로드 시 `/api/restaurants`(GET)에서 전체 식당을 가져와
  사이드바에 카테고리별로 그룹핑하고, 지도에 카테고리 색상 마커로 표시합니다.
- **필터**: 상단 칩으로 카테고리를 선택하면 지도 마커와 리스트가 함께 필터링됩니다.
- **선택**: 리스트 항목 클릭 시 해당 마커로 지도가 이동하고 인포윈도우가 열립니다.
- **추가**: "+ 식당 추가" → 카카오 장소검색으로 식당을 찾아 클릭하면 좌표·주소가
  자동 입력되고, 카테고리(자동 추정)·메모를 정해 `/api/restaurants`(POST)로 저장합니다.

## 6. 커스터마이징

- 카테고리/색상: [`lib/types.ts`](lib/types.ts)의 `CATEGORIES`, `CATEGORY_COLORS`
- 회사 위치: `.env.local`의 `NEXT_PUBLIC_COMPANY_LAT/LNG`
