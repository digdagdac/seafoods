import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AlertStreamService } from './alert.gateway';
import {
  ALERT_CREATE_JOB,
  ALERT_QUEUE_NAME,
  ALERT_TYPES,
  AlertTypeValue,
  SUBSCRIPTION_TYPES,
} from './alert.constants';

interface SanctionAlertJob {
  sanctionId: string;
}

interface RedisConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
}

const ALERT_TYPE_PRIORITY: Record<AlertTypeValue, number> = {
  BOOKMARK_SANCTION: 3,
  REGION_SANCTION: 2,
  CATEGORY_SANCTION: 1,
};

@Injectable()
export class NotificationService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private queue?: Queue<SanctionAlertJob>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly alertStreamService: AlertStreamService,
  ) {}

  async onModuleDestroy() {
    if (this.queue) {
      await this.queue.close();
    }
  }

  async enqueueSanctionAlert(sanctionId: string) {
    const queue = this.getQueue();
    await queue.add(ALERT_CREATE_JOB, { sanctionId });
    return { queued: true };
  }

  async processJob(job: Job<SanctionAlertJob>) {
    if (job.name !== ALERT_CREATE_JOB) {
      this.logger.warn(`Unknown alert job: ${job.name}`);
      return { created: 0 };
    }

    return this.createAlertsForSanction(job.data.sanctionId);
  }

  async createAlertsForSanction(sanctionId: string) {
    const sanction = await this.prisma.sanction.findUnique({
      where: { id: sanctionId },
      select: {
        id: true,
        sanctionType: true,
        violationContent: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            category: true,
            regionCode: true,
          },
        },
      },
    });

    if (!sanction) {
      throw new NotFoundException('행정처분을 찾을 수 없습니다');
    }

    const [bookmarks, subscriptions] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { restaurantId: sanction.restaurant.id },
        select: { userId: true },
      }),
      this.prisma.alertSubscription.findMany({
        where: {
          isActive: true,
          OR: [
            {
              subscriptionType: SUBSCRIPTION_TYPES.RESTAURANT,
              targetValue: sanction.restaurant.id,
            },
            {
              subscriptionType: SUBSCRIPTION_TYPES.REGION,
              targetValue: sanction.restaurant.regionCode,
            },
            {
              subscriptionType: SUBSCRIPTION_TYPES.CATEGORY,
              targetValue: sanction.restaurant.category,
            },
          ],
        },
        select: {
          userId: true,
          subscriptionType: true,
        },
      }),
    ]);

    const userAlertType = new Map<string, AlertTypeValue>();

    for (const bookmark of bookmarks) {
      userAlertType.set(bookmark.userId, ALERT_TYPES.BOOKMARK_SANCTION);
    }

    for (const subscription of subscriptions) {
      const nextType = this.mapSubscriptionToAlertType(subscription.subscriptionType);
      const currentType = userAlertType.get(subscription.userId);
      if (!currentType || ALERT_TYPE_PRIORITY[nextType] > ALERT_TYPE_PRIORITY[currentType]) {
        userAlertType.set(subscription.userId, nextType);
      }
    }

    const title = `[행정처분] ${sanction.restaurant.name}`;
    const body = `${sanction.sanctionType} - ${sanction.violationContent}`;

    if (userAlertType.size === 0) {
      return { created: 0 };
    }

    const userIds = [...userAlertType.keys()];
    const alreadyAlerted = await this.prisma.alert.findMany({
      where: { sanctionId, userId: { in: userIds } },
      select: { userId: true },
    });
    const alreadyAlertedUserIds = new Set(alreadyAlerted.map((alert) => alert.userId));

    const data = [...userAlertType.entries()]
      .filter(([userId]) => !alreadyAlertedUserIds.has(userId))
      .map(([userId, alertType]) => ({
      userId,
      sanctionId: sanction.id,
      alertType,
      title,
      body,
      }));

    if (data.length === 0) {
      return { created: 0 };
    }

    await this.prisma.alert.createMany({ data });

    for (const [userId, alertType] of userAlertType.entries()) {
      if (alreadyAlertedUserIds.has(userId)) {
        continue;
      }
      this.alertStreamService.publishToUser(userId, {
        sanctionId: sanction.id,
        alertType,
        title,
        body,
      });
    }

    return { created: data.length };
  }

  private buildRedisConnection(): RedisConnection {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    const parsed = new URL(redisUrl);

    const db = parsed.pathname?.slice(1)
      ? Number.parseInt(parsed.pathname.slice(1), 10)
      : undefined;

    return {
      host: parsed.hostname,
      port: Number.parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: Number.isFinite(db as number) ? db : undefined,
    };
  }

  private mapSubscriptionToAlertType(
    subscriptionType: typeof SUBSCRIPTION_TYPES[keyof typeof SUBSCRIPTION_TYPES],
  ): AlertTypeValue {
    if (subscriptionType === SUBSCRIPTION_TYPES.REGION) {
      return ALERT_TYPES.REGION_SANCTION;
    }

    if (subscriptionType === SUBSCRIPTION_TYPES.CATEGORY) {
      return ALERT_TYPES.CATEGORY_SANCTION;
    }

    return ALERT_TYPES.BOOKMARK_SANCTION;
  }

  private getQueue() {
    if (this.queue) {
      return this.queue;
    }

    this.queue = new Queue<SanctionAlertJob>(ALERT_QUEUE_NAME, {
      connection: this.buildRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 500,
      },
    });

    return this.queue;
  }
}
