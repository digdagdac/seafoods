import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionType } from '@prisma/client';

export interface CreateSubscriptionDto {
  subscriptionType: SubscriptionType;
  targetValue: string;
}

@Injectable()
export class AlertService {
  constructor(private prisma: PrismaService) {}

  // ── Notification list ──────────────────────────────────────────────────

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
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    const unreadCount = await this.prisma.alert.count({
      where: { userId, isRead: false },
    });

    return { items, cursor: nextCursor, hasMore, unreadCount };
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

  // ── Subscriptions ──────────────────────────────────────────────────────

  async findSubscriptions(userId: string) {
    const subscriptions = await this.prisma.alertSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return { items: subscriptions };
  }

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const existing = await this.prisma.alertSubscription.findUnique({
      where: {
        userId_subscriptionType_targetValue: {
          userId,
          subscriptionType: dto.subscriptionType,
          targetValue: dto.targetValue,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('이미 구독 중입니다');
      }
      // Reactivate
      return this.prisma.alertSubscription.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }

    return this.prisma.alertSubscription.create({
      data: {
        userId,
        subscriptionType: dto.subscriptionType,
        targetValue: dto.targetValue,
      },
    });
  }

  async removeSubscription(userId: string, subscriptionId: string) {
    const sub = await this.prisma.alertSubscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!sub) {
      throw new NotFoundException('구독을 찾을 수 없습니다');
    }

    await this.prisma.alertSubscription.delete({ where: { id: subscriptionId } });

    return { success: true };
  }
}
