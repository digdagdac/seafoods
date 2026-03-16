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
  ApiResponse,
} from '@nestjs/swagger';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IsOptional, IsArray, IsString } from 'class-validator';

class SubscribeRequestBody {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restaurantIds?: string[];
}

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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

  @Get('unread-count')
  @ApiOperation({ summary: '안 읽은 알림 수' })
  getUnreadCount(@Request() req: { user: { id: string } }) {
    return this.alertService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiParam({ name: 'id' })
  markRead(
    @Request() req: { user: { id: string } },
    @Param('id') alertId: string,
  ) {
    return this.alertService.markRead(req.user.id, alertId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  markAllRead(@Request() req: { user: { id: string } }) {
    return this.alertService.markAllRead(req.user.id);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: '내 구독 목록' })
  findSubscriptions(@Request() req: { user: { id: string } }) {
    return this.alertService.findSubscriptions(req.user.id);
  }

  @Post('subscribe')
  @ApiOperation({ summary: '구독 등록' })
  subscribe(
    @Request() req: { user: { id: string } },
    @Body() body: SubscribeRequestBody,
  ) {
    return this.alertService.subscribe(req.user.id, body);
  }

  @Delete('subscribe/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '구독 해제' })
  @ApiParam({ name: 'id', description: '구독 ID' })
  unsubscribe(
    @Request() req: { user: { id: string } },
    @Param('id') subscriptionId: string,
  ) {
    return this.alertService.unsubscribe(req.user.id, subscriptionId);
  }
}
