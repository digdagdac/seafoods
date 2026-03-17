# Task: 모바일 반응형 디자인 개선

## 프로젝트
- Next.js 14 App Router: apps/web/
- Tailwind CSS 기반
- 모바일 퍼스트 (375px 기준)

## 작업 목록

### 1. 글로벌 레이아웃 (src/app/layout.tsx)
- viewport meta 확인, safe-area 패딩 추가
- 폰트 사이즈 모바일 최적화

### 2. 홈 페이지 (src/app/page.tsx)
- 검색바 모바일에서 풀 너비
- 최근 행정처분 카드 모바일에서 세로 스크롤
- 통계 섹션 그리드 1열 → 2열 반응형

### 3. 검색 결과 (src/app/search/page.tsx)
- 필터 패널 모바일에서 하단 시트/접기
- 검색 결과 카드 터치 영역 최소 44px
- 무한스크롤 로딩 인디케이터

### 4. 음식점 상세 (src/app/restaurant/[id]/page.tsx)
- 행정처분 타임라인 모바일 최적화
- 뒤로가기 헤더 고정

### 5. 알림 페이지 (src/app/alerts/page.tsx)
- 알림 카드 스와이프 가능한 레이아웃
- 빈 상태 UI 개선

### 6. 마이페이지 (src/app/my/page.tsx)
- 메뉴 리스트 터치 최적화
- 프로필 영역 모바일 레이아웃

### 7. 하단 네비게이션 (src/components/layout/bottom-nav.tsx)
- 아이콘+텍스트 크기 조정
- safe-area 하단 패딩
- 활성 상태 표시 개선

### 8. 헤더 (src/components/layout/header.tsx)
- 스크롤 시 축소 효과
- 모바일 햄버거 메뉴 (필요 시)

### 디자인 토큰
- Primary: Navy (#1B2A4A), Accent: Teal (#2DD4BF)
- 심각도: CRITICAL(#DC2626), HIGH(#F97316), MEDIUM(#EAB308), LOW(#22C55E)
- 터치 타겟 최소 44px, 폰트: Pretendard/Noto Sans KR

완료 후: git add -A && git commit -m "design: 모바일 반응형 디자인 개선"
