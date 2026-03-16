import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubscriptionType } from '@prisma/client';

class CreateSubscriptionBody {
  subscriptionType!: SubscriptionType;
  targetValue!: string;
}

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // ── Notifications ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '내 알림 목록' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '알림 목록 + 미읽음 수' })
  findAlerts(
    @Request() req: { user: { id: string } },
    @Query('unreadOnly') unreadOnly?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.alertService.findAlerts(
      req.user.id,
      unreadOnly === 'true',
      cursor,
      limit,
    );
  }

  @Patch(':alertId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiParam({ name: 'alertId' })
  @ApiResponse({ status: 200, description: '읽음 처리 완료' })
  @ApiResponse({ status: 404, description: '알림 없음' })
  markRead(
    @Request() req: { user: { id: string } },
    @Param('alertId') alertId: string,
  ) {
    return this.alertService.markRead(req.user.id, alertId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '{ updated: number }' })
  markAllRead(@Request() req: { user: { id: string } }) {
    return this.alertService.markAllRead(req.user.id);
  }

  // ── Subscriptions ──────────────────────────────────────────────────────

  @Get('subscriptions')
  @ApiOperation({ summary: '알림 구독 목록' })
  @ApiResponse({ status: 200, description: '구독 목록' })
  findSubscriptions(@Request() req: { user: { id: string } }) {
    return this.alertService.findSubscriptions(req.user.id);
  }

  @Post('subscriptions')
  @ApiOperation({ summary: '알림 구독 추가' })
  @ApiBody({ type: CreateSubscriptionBody })
  @ApiResponse({ status: 201, description: '구독 추가 성공' })
  @ApiResponse({ status: 409, description: '이미 구독 중' })
  createSubscription(
    @Request() req: { user: { id: string } },
    @Body() body: CreateSubscriptionBody,
  ) {
    return this.alertService.createSubscription(req.user.id, body);
  }

  @Delete('subscriptions/:subscriptionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '알림 구독 삭제' })
  @ApiParam({ name: 'subscriptionId' })
  @ApiResponse({ status: 200, description: '구독 삭제 성공' })
  @ApiResponse({ status: 404, description: '구독 없음' })
  removeSubscription(
    @Request() req: { user: { id: string } },
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.alertService.removeSubscription(req.user.id, subscriptionId);
  }
}
