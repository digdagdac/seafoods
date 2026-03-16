import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 음식점 데이터
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: '행복한 치킨',
        normalizedName: '행복한 치킨',
        businessNumber: '123-45-67890',
        category: '치킨',
        subcategory: '후라이드/양념',
        roadAddress: '서울특별시 강남구 테헤란로 123',
        jibunAddress: '서울특별시 강남구 역삼동 123-4',
        regionCode: '11680',
        latitude: 37.5012,
        longitude: 127.0396,
        status: 'ACTIVE',
        totalSanctions: 2,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: '맛있는 피자',
        normalizedName: '맛있는 피자',
        businessNumber: '234-56-78901',
        category: '피자',
        subcategory: '피자/양식',
        roadAddress: '서울특별시 서초구 서초대로 456',
        jibunAddress: '서울특별시 서초구 서초동 456-7',
        regionCode: '11650',
        latitude: 37.4837,
        longitude: 127.0324,
        status: 'ACTIVE',
        totalSanctions: 1,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: '골목 분식',
        normalizedName: '골목 분식',
        businessNumber: '345-67-89012',
        category: '분식',
        roadAddress: '서울특별시 마포구 홍익로 78',
        jibunAddress: '서울특별시 마포구 서교동 78-9',
        regionCode: '11440',
        latitude: 37.5563,
        longitude: 126.9236,
        status: 'SUSPENDED',
        totalSanctions: 3,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: '서울 족발',
        normalizedName: '서울 족발',
        businessNumber: '456-78-90123',
        category: '족발/보쌈',
        roadAddress: '서울특별시 종로구 종로 100',
        regionCode: '11110',
        latitude: 37.5704,
        longitude: 126.9831,
        status: 'ACTIVE',
        totalSanctions: 0,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: '황금 중식당',
        normalizedName: '황금 중식당',
        businessNumber: '567-89-01234',
        category: '중식',
        roadAddress: '서울특별시 송파구 올림픽로 200',
        regionCode: '11710',
        latitude: 37.5145,
        longitude: 127.1050,
        status: 'ACTIVE',
        totalSanctions: 1,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: '엄마손 김밥',
        normalizedName: '엄마손 김밥',
        businessNumber: '678-90-12345',
        category: '분식',
        roadAddress: '서울특별시 강남구 선릉로 55',
        regionCode: '11680',
        latitude: 37.5045,
        longitude: 127.0489,
        status: 'CLOSED',
        totalSanctions: 1,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: '대박 떡볶이',
        normalizedName: '대박 떡볶이',
        businessNumber: '789-01-23456',
        category: '분식',
        roadAddress: '부산광역시 해운대구 해운대로 300',
        regionCode: '26350',
        latitude: 35.1631,
        longitude: 129.1636,
        status: 'ACTIVE',
        totalSanctions: 2,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: '진짜 초밥',
        normalizedName: '진짜 초밥',
        businessNumber: '890-12-34567',
        category: '일식',
        roadAddress: '서울특별시 강남구 압구정로 77',
        regionCode: '11680',
        latitude: 37.5270,
        longitude: 127.0286,
        status: 'ACTIVE',
        totalSanctions: 1,
      },
    }),
  ]);

  console.log(`✅ ${restaurants.length}개 음식점 생성`);

  // 행정처분 데이터
  const sanctions = await Promise.all([
    // 행복한 치킨 - 2건
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[0].id,
        sanctionType: 'FINE',
        severity: 'MEDIUM',
        violationContent: '식품위생법 제44조 위반 - 유통기한 경과 원료 사용',
        dispositionContent: '과징금 100만원',
        dispositionDate: new Date('2025-11-15'),
        matchConfidence: 0.95,
        isVerified: true,
        source: 'food-safety-korea',
        sourceId: 'FSK-2025-001',
      },
    }),
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[0].id,
        sanctionType: 'IMPROVEMENT_ORDER',
        severity: 'LOW',
        violationContent: '조리장 시설기준 미달 - 환기시설 부적합',
        dispositionContent: '시정명령 (30일 이내)',
        dispositionDate: new Date('2025-06-20'),
        matchConfidence: 0.92,
        isVerified: true,
        source: 'food-safety-korea',
        sourceId: 'FSK-2025-002',
      },
    }),
    // 맛있는 피자 - 1건
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[1].id,
        sanctionType: 'WARNING',
        severity: 'LOW',
        violationContent: '건강진단 미실시 - 종업원 1명',
        dispositionContent: '경고',
        dispositionDate: new Date('2025-09-10'),
        matchConfidence: 0.88,
        isVerified: true,
        source: 'data-go-kr',
        sourceId: 'DGK-2025-101',
      },
    }),
    // 골목 분식 - 3건 (심각)
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[2].id,
        sanctionType: 'LICENSE_SUSPENSION',
        severity: 'HIGH',
        violationContent: '식중독 발생 - 살모넬라균 검출',
        dispositionContent: '영업정지 2개월',
        dispositionDate: new Date('2026-01-05'),
        matchConfidence: 0.98,
        isVerified: true,
        source: 'food-safety-korea',
        sourceId: 'FSK-2026-010',
      },
    }),
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[2].id,
        sanctionType: 'FINE',
        severity: 'MEDIUM',
        violationContent: '원산지 표시 위반 - 돼지고기 원산지 미표시',
        dispositionContent: '과징금 200만원',
        dispositionDate: new Date('2025-08-15'),
        matchConfidence: 0.94,
        isVerified: true,
        source: 'data-go-kr',
        sourceId: 'DGK-2025-102',
      },
    }),
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[2].id,
        sanctionType: 'CLOSURE_ORDER',
        severity: 'CRITICAL',
        violationContent: '무허가 영업 - 영업신고 없이 배달 영업',
        dispositionContent: '폐쇄명령',
        dispositionDate: new Date('2026-02-20'),
        matchConfidence: 0.99,
        isVerified: true,
        source: 'food-safety-korea',
        sourceId: 'FSK-2026-020',
      },
    }),
    // 황금 중식당 - 1건
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[4].id,
        sanctionType: 'FINE',
        severity: 'MEDIUM',
        violationContent: '식품위생법 제31조 위반 - 위생교육 미이수',
        dispositionContent: '과징금 50만원',
        dispositionDate: new Date('2025-12-01'),
        matchConfidence: 0.90,
        isVerified: true,
        source: 'data-go-kr',
        sourceId: 'DGK-2025-201',
      },
    }),
    // 엄마손 김밥 - 1건
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[5].id,
        sanctionType: 'LICENSE_REVOCATION',
        severity: 'CRITICAL',
        violationContent: '식중독 반복 발생 및 영업정지 기간 중 영업',
        dispositionContent: '영업허가 취소',
        dispositionDate: new Date('2026-03-01'),
        matchConfidence: 0.97,
        isVerified: true,
        source: 'food-safety-korea',
        sourceId: 'FSK-2026-030',
      },
    }),
    // 대박 떡볶이 - 2건
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[6].id,
        sanctionType: 'WARNING',
        severity: 'LOW',
        violationContent: '음식물 쓰레기 처리 기준 미준수',
        dispositionContent: '경고',
        dispositionDate: new Date('2025-07-20'),
        matchConfidence: 0.85,
        isVerified: true,
        source: 'data-go-kr',
        sourceId: 'DGK-2025-301',
      },
    }),
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[6].id,
        sanctionType: 'FINE',
        severity: 'MEDIUM',
        violationContent: '식품위생법 제44조 위반 - 조리장 위생관리 불량',
        dispositionContent: '과징금 150만원',
        dispositionDate: new Date('2026-02-10'),
        matchConfidence: 0.91,
        isVerified: true,
        source: 'food-safety-korea',
        sourceId: 'FSK-2026-040',
      },
    }),
    // 진짜 초밥 - 1건
    prisma.sanction.create({
      data: {
        restaurantId: restaurants[7].id,
        sanctionType: 'LICENSE_SUSPENSION',
        severity: 'HIGH',
        violationContent: '식품위생법 위반 - 비위생적 수산물 취급',
        dispositionContent: '영업정지 15일',
        dispositionDate: new Date('2026-01-25'),
        matchConfidence: 0.93,
        isVerified: true,
        source: 'food-safety-korea',
        sourceId: 'FSK-2026-050',
      },
    }),
  ]);

  console.log(`✅ ${sanctions.length}개 행정처분 생성`);
  console.log('🎉 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
