import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchSuggestionQueryDto } from './dto/search-query.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '통합 검색 (pg_trgm 유사도 + 다중 필터 + 커서 페이지네이션)' })
  @ApiResponse({ status: 200, description: '검색 결과 (정렬/필터 적용)' })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: '검색 자동완성 (2글자 이상)' })
  @ApiResponse({ status: 200, description: '자동완성 후보 목록' })
  suggestions(@Query() query: SearchSuggestionQueryDto) {
    return this.searchService.suggestions(query.q, query.limit);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: '검색 자동완성 별칭 엔드포인트' })
  @ApiResponse({ status: 200, description: '자동완성 후보 목록' })
  autocomplete(@Query() query: SearchSuggestionQueryDto) {
    return this.searchService.suggestions(query.q, query.limit);
  }
}
