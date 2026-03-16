import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '통합 검색 (pg_trgm 유사도 검색)' })
  @ApiQuery({ name: 'q', required: true, description: '검색어' })
  @ApiQuery({ name: 'region', required: false, description: '지역코드' })
  @ApiQuery({ name: 'category', required: false, description: '업종' })
  @ApiQuery({ name: 'hasSanction', required: false, type: Boolean })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '검색 결과 (유사도 순)' })
  search(
    @Query('q') q: string,
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('hasSanction') hasSanction?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const hasSanctionBool =
      hasSanction === 'true' ? true : hasSanction === 'false' ? false : undefined;

    return this.searchService.search({ q, region, category, hasSanction: hasSanctionBool, cursor, limit });
  }

  @Get('suggestions')
  @ApiOperation({ summary: '검색 자동완성 제안' })
  @ApiQuery({ name: 'q', required: true, description: '검색어 (최소 2자)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '최대 10' })
  @ApiResponse({ status: 200, description: '자동완성 후보 목록' })
  suggestions(
    @Query('q') q: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit = 5,
  ) {
    return this.searchService.suggestions(q, limit);
  }
}
