# Task: 공공데이터 수집 파이프라인 구현

## 브랜치: feature/data-pipeline
## 역할: Backend Developer

### 목표
식품안전나라/공공데이터포털에서 행정처분 데이터를 자동 수집하는 워커 시스템 구현

### 구현 요구사항

1. **workers/sanction-collector/** 디렉토리에 크롤러 구현
   - `src/collectors/food-safety-korea.ts` - 식품안전나라 API 크롤러
   - `src/collectors/data-go-kr.ts` - 공공데이터포털 API 크롤러
   - `src/collectors/base-collector.ts` - 공통 인터페이스

2. **데이터 정규화 파이프라인**
   - `src/pipeline/normalizer.ts` - 수집 데이터 → RawSanction 변환
   - `src/pipeline/matcher.ts` - 음식점 매칭 로직 (이름+주소 fuzzy match)
   - `src/pipeline/processor.ts` - RawSanction → Sanction 처리

3. **BullMQ 작업 큐**
   - `src/jobs/collect-job.ts` - 수집 작업 (크론: 매일 2회)
   - `src/jobs/process-job.ts` - 정규화/매칭 작업
   - `src/jobs/cleanup-job.ts` - 중복 제거/정리 작업

4. **워커 진입점**
   - `src/index.ts` - BullMQ Worker 부트스트랩
   - `package.json` - 패키지 설정

### 기술 스택
- TypeScript, BullMQ, ioredis, @prisma/client
- packages/utils의 normalizeRestaurantName, normalizeAddress 활용
- prisma/schema.prisma의 RawSanction, Sanction 모델 참조

### 파일 구조
```
workers/sanction-collector/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── collectors/
│   │   ├── base-collector.ts
│   │   ├── food-safety-korea.ts
│   │   └── data-go-kr.ts
│   ├── pipeline/
│   │   ├── normalizer.ts
│   │   ├── matcher.ts
│   │   └── processor.ts
│   └── jobs/
│       ├── collect-job.ts
│       ├── process-job.ts
│       └── cleanup-job.ts
```

### 작업 완료 후
- git add && git commit -m "feat(data-pipeline): 공공데이터 수집 파이프라인 구현"
