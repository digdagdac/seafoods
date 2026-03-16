import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { AlertService } from './alert.service';

function createPrismaMock() {
  return {
    alert: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    alertSubscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

describe('AlertService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AlertService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AlertService(prisma as any);
  });

  it('returns unread count', async () => {
    prisma.alert.count.mockResolvedValue(7);

    const result = await service.getUnreadCount('u1');

    expect(result).toEqual({ unreadCount: 7 });
    expect(prisma.alert.count).toHaveBeenCalledWith({ where: { userId: 'u1', isRead: false } });
  });

  it('creates subscriptions from array payload', async () => {
    prisma.alertSubscription.findUnique.mockResolvedValue(null);
    prisma.alertSubscription.create.mockResolvedValue({});

    const result = await service.subscribe('u1', {
      regions: ['11'],
      categories: ['치킨'],
      restaurantIds: ['r1'],
    });

    expect(result).toEqual({ created: 3, reactivated: 0, skipped: 0 });
    expect(prisma.alertSubscription.create).toHaveBeenCalledTimes(3);
    expect(prisma.alertSubscription.create).toHaveBeenCalledWith({
      data: { userId: 'u1', subscriptionType: 'REGION', targetValue: '11' },
    });
  });

  it('deletes only owned subscription on unsubscribe', async () => {
    prisma.alertSubscription.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.unsubscribe('u1', 'sub-1');

    expect(result).toEqual({ success: true });
    expect(prisma.alertSubscription.deleteMany).toHaveBeenCalledWith({
      where: { id: 'sub-1', userId: 'u1' },
    });
  });
});
