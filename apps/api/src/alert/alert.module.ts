import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { AlertGateway, AlertStreamService } from './alert.gateway';

@Module({
  imports: [ConfigModule],
  controllers: [AlertController, AlertGateway],
  providers: [
    AlertService,
    AlertStreamService,
    NotificationService,
    NotificationProcessor,
  ],
  exports: [AlertService, NotificationService, AlertStreamService],
})
export class AlertModule {}
