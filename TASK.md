# Task: 프론트엔드 페이지 완성

## 브랜치: feature/web-pages
## 역할: Frontend Developer / Designer

### 목표
Next.js 14 App Router 기반 모든 페이지 구현 (모바일 퍼스트)

### 구현 요구사항

1. **홈 페이지 (src/app/page.tsx) 완성**
   - 히어로 섹션 (검색바 + 캐치프레이즈)
   - 최근 행정처분 피드 (무한스크롤)
   - 지역별 통계 요약 카드
   - 실시간 데이터 갱신 표시

2. **검색 결과 페이지 (src/app/search/page.tsx) 완성**
   - 필터 패널 (지역/유형/기간/심각도) - 모바일: bottom sheet
   - 검색 결과 리스트 (SanctionCard 사용)
   - 정렬 옵션 (관련도/최신/심각도)
   - 커서 기반 무한스크롤

3. **음식점 상세 페이지 (src/app/restaurant/[id]/page.tsx) 완성**
   - 음식점 기본 정보 헤더
   - 행정처분 타임라인 (시각적 severity indicator)
   - 지도 위치 표시 (카카오맵 or 네이버맵)
   - 즐겨찾기 버튼
   - 외부 리뷰 링크 (네이버/카카오)

4. **새 페이지 구현**
   - `src/app/map/page.tsx` - 지도 기반 주변 검색
   - `src/app/alerts/page.tsx` - 알림 목록
   - `src/app/mypage/page.tsx` - 마이페이지 (즐겨찾기, 구독, 설정)
   - `src/app/auth/login/page.tsx` - 로그인 (소셜 버튼)
   - `src/app/auth/signup/page.tsx` - 회원가입

5. **공통 컴포넌트**
   - `src/components/ui/filter-panel.tsx` - 필터 UI
   - `src/components/ui/infinite-scroll.tsx` - 무한스크롤 래퍼
   - `src/components/ui/loading-skeleton.tsx` - 스켈레톤 UI
   - `src/components/ui/empty-state.tsx` - 빈 상태 UI
   - `src/components/ui/toast.tsx` - 토스트 알림

6. **API 연동**
   - `src/lib/api.ts` 완성 (모든 API 엔드포인트)
   - React Query hooks (useSearch, useRestaurant, useAlerts 등)
   - `src/hooks/` 디렉토리 정리

### 디자인 가이드
- 모바일 퍼스트 (375px 기준)
- Primary: Navy (#1B2A4A), Accent: Teal (#2DD4BF)
- 심각도 색상: CRITICAL(#DC2626), HIGH(#F97316), MEDIUM(#EAB308), LOW(#22C55E)
- 폰트: Pretendard/Noto Sans KR
- 카드 기반 레이아웃, 좌측 border로 severity 표시

### 작업 완료 후
- git add && git commit -m "feat(web): 프론트엔드 페이지 구현"
