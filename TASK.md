# Task: 검색/필터링 API 완성

## 브랜치: feature/search-filter
## 역할: Backend Developer

### 목표
pg_trgm 기반 한국어 퍼지 검색 + 다중 필터링 API 완성

### 구현 요구사항

1. **apps/api/src/search/search.service.ts 개선**
   - pg_trgm similarity() 기반 한국어 퍼지 검색
   - 자동완성 API (2글자 이상 입력 시)
   - 검색 결과에 행정처분 이력 포함 (JOIN)

2. **필터링 시스템 구현**
   - `apps/api/src/search/dto/search-query.dto.ts` - Zod/class-validator 기반 DTO
   - 지역 필터 (시/도, 시/군/구)
   - 처분 유형 필터 (SanctionType enum)
   - 기간 필터 (dateFrom, dateTo)
   - 심각도 필터 (severity)
   - 행정처분 유무 필터 (hasSanction boolean)

3. **정렬/페이지네이션**
   - 커서 기반 페이지네이션 (cursor + limit)
   - 정렬: relevance(기본), date_desc, date_asc, severity

4. **주변 검색 API**
   - PostGIS ST_DWithin 기반 반경 검색
   - `apps/api/src/restaurant/restaurant.service.ts` nearby 메서드 완성

5. **통계 API**
   - `apps/api/src/sanction/sanction.service.ts`에 getStats() 추가
   - 유형별/심각도별/월별/지역별 통계

### 참조
- packages/dto/src/index.ts의 SearchRequestDto, NearbyRequestDto
- prisma/schema.prisma 모델 구조

### 작업 완료 후
- git add && git commit -m "feat(search): 검색/필터링/통계 API 완성"
