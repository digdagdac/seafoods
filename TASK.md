# Task: 알림/구독 시스템 구현

## 브랜치: feature/alert-system
## 역할: Backend Developer

### 목표
BullMQ 기반 알림 시스템 + 구독 관리 구현

### 구현 요구사항

1. **구독 관리 API 완성**
   - `apps/api/src/alert/alert.service.ts`
   - POST /alerts/subscribe - 구독 등록 (지역/카테고리/음식점)
   - DELETE /alerts/subscribe/:id - 구독 해제
   - GET /alerts/subscriptions - 내 구독 목록

2. **알림 생성 엔진**
   - `apps/api/src/alert/notification.service.ts` - 새 행정처분 발생 시 매칭 구독자 탐색
   - `apps/api/src/alert/notification.processor.ts` - BullMQ 프로세서
   - 알림 유형: BOOKMARK_SANCTION, REGION_SANCTION, CATEGORY_SANCTION

3. **알림 조회/관리 API**
   - GET /alerts - 내 알림 목록 (페이지네이션)
   - PATCH /alerts/:id/read - 읽음 처리
   - PATCH /alerts/read-all - 전체 읽음 처리
   - GET /alerts/unread-count - 안읽은 알림 수

4. **실시간 알림 (SSE)**
   - `apps/api/src/alert/alert.gateway.ts` - Server-Sent Events 엔드포인트
   - GET /alerts/stream - SSE 연결

### 참조
- prisma/schema.prisma Alert, AlertSubscription 모델
- packages/dto/src/index.ts SubscribeRequestDto

### 작업 완료 후
- git add && git commit -m "feat(alert): 알림/구독 시스템 구현"
