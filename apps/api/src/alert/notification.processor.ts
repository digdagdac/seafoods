import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { ALERT_QUEUE_NAME } from './alert.constants';
import { NotificationService } from './notification.service';

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

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);
  private worker?: Worker<SanctionAlertJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<SanctionAlertJob>(
      ALERT_QUEUE_NAME,
      async (job: Job<SanctionAlertJob>) => this.notificationService.processJob(job),
      {
        connection: this.buildRedisConnection(),
      },
    );

    this.worker.on('error', (error) => {
      this.logger.error(`Alert worker error: ${error.message}`, error.stack);
    });
  }

  async onModuleDestroy() {
    if (!this.worker) {
      return;
    }
    await this.worker.close();
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
}
