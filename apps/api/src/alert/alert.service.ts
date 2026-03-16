import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeRequestDto } from '@safedeliver/dto';
import { SUBSCRIPTION_TYPES, SubscriptionTypeValue } from './alert.constants';

interface SubscriptionItem {
  subscriptionType: SubscriptionTypeValue;
  targetValue: string;
}

@Injectable()
export class AlertService {
  constructor(private prisma: PrismaService) {}

  async findAlerts(userId: string, onlyUnread = false, cursor?: string, limit = 20) {
    const take = Math.min(limit, 100);

    const alerts = await this.prisma.alert.findMany({
      where: {
        userId,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { sentAt: 'desc' },
      select: {
        id: true,
        alertType: true,
        title: true,
        body: true,
        isRead: true,
        sentAt: true,
        readAt: true,
        sanction: {
          select: {
            id: true,
            sanctionType: true,
            severity: true,
            dispositionDate: true,
            restaurant: {
              select: { id: true, name: true, category: true },
            },
          },
        },
      },
    });

    const hasMore = alerts.length > take;
    const items = hasMore ? alerts.slice(0, take) : alerts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, cursor: nextCursor, hasMore };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.alert.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  async markRead(userId: string, alertId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('알림을 찾을 수 없습니다');
    }

    return this.prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true, readAt: new Date() },
      select: { id: true, isRead: true, readAt: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.alert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { updated: result.count };
  }

  async findSubscriptions(userId: string) {
    const items = await this.prisma.alertSubscription.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return { items };
  }

  async subscribe(userId: string, dto: SubscribeRequestDto) {
    const targets = this.normalizeSubscribePayload(dto);

    if (targets.length === 0) {
      throw new BadRequestException('최소 1개 이상의 구독 대상을 입력하세요');
    }

    let created = 0;
    let reactivated = 0;
    let skipped = 0;

    for (const target of targets) {
      const existing = await this.prisma.alertSubscription.findUnique({
        where: {
          userId_subscriptionType_targetValue: {
            userId,
            subscriptionType: target.subscriptionType,
            targetValue: target.targetValue,
          },
        },
      });

      if (!existing) {
        await this.prisma.alertSubscription.create({
          data: {
            userId,
            subscriptionType: target.subscriptionType,
            targetValue: target.targetValue,
          },
        });
        created += 1;
        continue;
      }

      if (!existing.isActive) {
        await this.prisma.alertSubscription.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        reactivated += 1;
        continue;
      }

      skipped += 1;
    }

    return { created, reactivated, skipped };
  }

  async unsubscribe(userId: string, subscriptionId: string) {
    const result = await this.prisma.alertSubscription.updateMany({
      where: { id: subscriptionId, userId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new NotFoundException('구독을 찾을 수 없습니다');
    }

    return { success: true };
  }

  private normalizeSubscribePayload(dto: SubscribeRequestDto): SubscriptionItem[] {
    const normalizeValues = (values?: string[]) =>
      (values ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    const regions = normalizeValues(dto.regions).map((targetValue) => ({
      subscriptionType: SUBSCRIPTION_TYPES.REGION,
      targetValue,
    }));
    const categories = normalizeValues(dto.categories).map((targetValue) => ({
      subscriptionType: SUBSCRIPTION_TYPES.CATEGORY,
      targetValue,
    }));
    const restaurantIds = normalizeValues(dto.restaurantIds).map((targetValue) => ({
      subscriptionType: SUBSCRIPTION_TYPES.RESTAURANT,
      targetValue,
    }));

    const deduped = new Map<string, SubscriptionItem>();

    for (const item of [...regions, ...categories, ...restaurantIds]) {
      const key = `${item.subscriptionType}:${item.targetValue}`;
      deduped.set(key, item);
    }

    return [...deduped.values()];
  }
}
