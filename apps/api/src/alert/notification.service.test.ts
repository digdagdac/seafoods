import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';

vi.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { NotificationService } from './notification.service';

function createPrismaMock() {
  return {
    sanction: {
      findUnique: vi.fn(),
    },
    bookmark: {
      findMany: vi.fn(),
    },
    alertSubscription: {
      findMany: vi.fn(),
    },
    alert: {
      createMany: vi.fn(),
    },
  };
}

describe('NotificationService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: NotificationService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new NotificationService(
      prisma as any,
      { get: vi.fn().mockReturnValue('redis://localhost:6379') } as any,
      { publishToUser: vi.fn() } as any,
    );
  });

  it('creates alerts for bookmark/region/category subscribers', async () => {
    prisma.sanction.findUnique.mockResolvedValue({
      id: 's1',
      sanctionType: 'WARNING',
      violationContent: '위생 불량',
      restaurant: {
        id: 'r1',
        name: '맛집',
        category: '치킨',
        regionCode: '11',
      },
    });
    prisma.bookmark.findMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
    prisma.alertSubscription.findMany.mockResolvedValue([
      { userId: 'u3', subscriptionType: 'REGION', targetValue: '11' },
      { userId: 'u4', subscriptionType: 'CATEGORY', targetValue: '치킨' },
      { userId: 'u1', subscriptionType: 'CATEGORY', targetValue: '치킨' },
      { userId: 'u5', subscriptionType: 'RESTAURANT', targetValue: 'r1' },
    ]);
    prisma.alert.createMany.mockResolvedValue({ count: 5 });

    const result = await service.createAlertsForSanction('s1');

    expect(result).toEqual({ created: 5 });
    expect(prisma.alert.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'u1', alertType: 'BOOKMARK_SANCTION' }),
          expect.objectContaining({ userId: 'u2', alertType: 'BOOKMARK_SANCTION' }),
          expect.objectContaining({ userId: 'u3', alertType: 'REGION_SANCTION' }),
          expect.objectContaining({ userId: 'u4', alertType: 'CATEGORY_SANCTION' }),
          expect.objectContaining({ userId: 'u5', alertType: 'BOOKMARK_SANCTION' }),
        ]),
      }),
    );
  });

  it('throws when sanction does not exist', async () => {
    prisma.sanction.findUnique.mockResolvedValue(null);

    await expect(service.createAlertsForSanction('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
