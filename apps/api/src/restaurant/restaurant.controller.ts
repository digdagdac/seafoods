import {
  Controller,
  Get,
  Param,
  Query,
  ParseFloatPipe,
  ParseIntPipe,
  DefaultValuePipe,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { RestaurantStatus } from '@prisma/client';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  @ApiOperation({ summary: '음식점 목록 조회 (커서 페이지네이션)' })
  @ApiQuery({ name: 'q', required: false, description: '검색어 (상호명, 주소)' })
  @ApiQuery({ name: 'region', required: false, description: '지역코드 (예: 11, 11010)' })
  @ApiQuery({ name: 'category', required: false, description: '업종 카테고리' })
  @ApiQuery({ name: 'hasSanction', required: false, type: Boolean, description: '행정처분 여부' })
  @ApiQuery({ name: 'status', required: false, enum: RestaurantStatus })
  @ApiQuery({ name: 'cursor', required: false, description: '다음 페이지 커서' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지 크기 (최대 100)' })
  @ApiResponse({ status: 200, description: '음식점 목록' })
  findAll(
    @Query('q') q?: string,
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('hasSanction') hasSanction?: string,
    @Query('status') status?: RestaurantStatus,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const hasSanctionBool =
      hasSanction === 'true' ? true : hasSanction === 'false' ? false : undefined;

    return this.restaurantService.findAll({
      q,
      region,
      category,
      hasSanction: hasSanctionBool,
      status,
      cursor,
      limit,
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: '주변 음식점 검색 (PostGIS)' })
  @ApiQuery({ name: 'lat', required: true, type: Number, description: '위도' })
  @ApiQuery({ name: 'lng', required: true, type: Number, description: '경도' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: '반경 (미터, 기본값 1000)' })
  @ApiQuery({ name: 'hasSanction', required: false, type: Boolean })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '주변 음식점 목록 (거리순)' })
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', new DefaultValuePipe(1000), ParseIntPipe) radius: number,
    @Query('hasSanction') hasSanction?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const hasSanctionBool =
      hasSanction === 'true' ? true : hasSanction === 'false' ? false : undefined;

    return this.restaurantService.findNearby({ lat, lng, radius, hasSanction: hasSanctionBool, cursor, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: '음식점 상세 조회 (최근 처분 5건 포함)' })
  @ApiParam({ name: 'id', description: '음식점 ID' })
  @ApiResponse({ status: 200, description: '음식점 상세 정보' })
  @ApiResponse({ status: 404, description: '음식점 없음' })
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  @Get(':id/sanctions')
  @ApiOperation({ summary: '음식점 행정처분 이력 목록' })
  @ApiParam({ name: 'id', description: '음식점 ID' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '행정처분 목록' })
  @ApiResponse({ status: 404, description: '음식점 없음' })
  findSanctions(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.restaurantService.findSanctions(id, cursor, limit);
  }
}
