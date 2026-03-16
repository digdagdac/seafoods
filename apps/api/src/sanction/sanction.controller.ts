import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { SanctionService } from './sanction.service';
import { SanctionType, SanctionSeverity } from '@prisma/client';

@ApiTags('sanctions')
@Controller('sanctions')
export class SanctionController {
  constructor(private readonly sanctionService: SanctionService) {}

  @Get()
  @ApiOperation({ summary: '행정처분 목록 조회' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'sanctionType', required: false, enum: SanctionType })
  @ApiQuery({ name: 'severity', required: false, enum: SanctionSeverity })
  @ApiQuery({ name: 'region', required: false, description: '지역코드' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'ISO 날짜 (처분일 시작)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'ISO 날짜 (처분일 종료)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '행정처분 목록' })
  findAll(
    @Query('restaurantId') restaurantId?: string,
    @Query('sanctionType') sanctionType?: SanctionType,
    @Query('severity') severity?: SanctionSeverity,
    @Query('region') region?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.sanctionService.findAll({
      restaurantId,
      sanctionType,
      severity,
      region,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      cursor,
      limit,
    });
  }

  @Get('recent')
  @ApiOperation({ summary: '최신 행정처분 피드' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '최대 50' })
  @ApiResponse({ status: 200, description: '최신 행정처분 목록' })
  findRecent(@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20) {
    return this.sanctionService.findRecent(limit);
  }

  @Get('stats')
  @ApiOperation({ summary: '행정처분 통계' })
  @ApiResponse({ status: 200, description: '전체/심각도별/유형별 통계' })
  getStats() {
    return this.sanctionService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: '행정처분 상세 조회' })
  @ApiParam({ name: 'id', description: '행정처분 ID' })
  @ApiResponse({ status: 200, description: '행정처분 상세 정보' })
  @ApiResponse({ status: 404, description: '행정처분 없음' })
  findOne(@Param('id') id: string) {
    return this.sanctionService.findOne(id);
  }
}
