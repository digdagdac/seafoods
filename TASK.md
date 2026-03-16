# Task: 디자인 시스템 + 반응형 완성

## 브랜치: feature/design-system
## 역할: UI/UX Designer

### 목표
Tailwind CSS 기반 디자인 시스템 완성 + 반응형 레이아웃

### 구현 요구사항

1. **디자인 토큰 완성 (tailwind.config.ts)**
   - 전체 컬러 팔레트 (primary, secondary, accent, severity levels)
   - 타이포그래피 스케일 (heading, body, caption)
   - 스페이싱 시스템 (4px 기반 그리드)
   - 그림자/반경/애니메이션 토큰
   - 반응형 브레이크포인트 (sm:640, md:768, lg:1024, xl:1280)

2. **기초 UI 컴포넌트**
   - `src/components/ui/button.tsx` - 버튼 (primary, secondary, ghost, danger + 크기)
   - `src/components/ui/input.tsx` - 인풋 (text, search, select)
   - `src/components/ui/badge.tsx` - 뱃지 (상태, 카운트)
   - `src/components/ui/card.tsx` - 카드 (기본, 호버 효과)
   - `src/components/ui/modal.tsx` - 모달/바텀시트
   - `src/components/ui/tabs.tsx` - 탭 네비게이션
   - `src/components/ui/chip.tsx` - 필터 칩 (토글)
   - `src/components/ui/avatar.tsx` - 아바타

3. **레이아웃 컴포넌트**
   - `src/components/layout/header.tsx` 개선 - 스크롤 시 축소, 뒤로가기
   - `src/components/layout/bottom-nav.tsx` 개선 - 활성 상태 애니메이션
   - `src/components/layout/page-container.tsx` - 페이지 래퍼 (safe-area)
   - `src/components/layout/sidebar.tsx` - 데스크톱 사이드바

4. **severity-badge.tsx 개선**
   - 애니메이션 pulse (CRITICAL)
   - 아이콘 추가 (경고, 체크 등)
   - 접근성: aria-label, 색각 이상 대응 (패턴/아이콘)

5. **다크모드**
   - CSS 변수 기반 테마 시스템
   - `src/lib/theme.ts` - 테마 토글 유틸리티
   - 모든 컴포넌트 dark: 변형

6. **글로벌 스타일**
   - `src/app/globals.css` - CSS 변수, 리셋, 기본 스타일
   - 애니메이션 키프레임 (fade-in, slide-up, skeleton-pulse)
   - 스크롤바 커스텀 스타일

7. **접근성 (WCAG AA)**
   - 모든 컴포넌트 키보드 네비게이션
   - focus-visible 스타일
   - 색상 대비 4.5:1 이상
   - screen reader 지원 (aria 속성)

### 디자인 원칙
- "안전"을 느끼게 하는 Navy(#1B2A4A) + Teal(#2DD4BF) 톤
- 심각도는 직관적: 빨강(위험) → 주황(높음) → 노랑(보통) → 초록(낮음)
- 정보 밀도: 한 화면에 핵심 정보만 (progressive disclosure)
- 터치 타겟 최소 44px

### 작업 완료 후
- git add && git commit -m "feat(design): 디자인 시스템 + 반응형 구현"
