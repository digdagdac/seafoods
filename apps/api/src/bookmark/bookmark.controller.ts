import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
import { BookmarkService } from './bookmark.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get()
  @ApiOperation({ summary: '내 즐겨찾기 목록' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '즐겨찾기 목록' })
  findAll(
    @Request() req: { user: { id: string } },
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.bookmarkService.findAll(req.user.id, cursor, limit);
  }

  @Post(':restaurantId')
  @ApiOperation({ summary: '즐겨찾기 추가' })
  @ApiParam({ name: 'restaurantId', description: '음식점 ID' })
  @ApiResponse({ status: 201, description: '즐겨찾기 추가 성공' })
  @ApiResponse({ status: 404, description: '음식점 없음' })
  @ApiResponse({ status: 409, description: '이미 즐겨찾기 추가됨' })
  create(
    @Request() req: { user: { id: string } },
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.bookmarkService.create(req.user.id, restaurantId);
  }

  @Delete(':restaurantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '즐겨찾기 삭제' })
  @ApiParam({ name: 'restaurantId', description: '음식점 ID' })
  @ApiResponse({ status: 200, description: '즐겨찾기 삭제 성공' })
  @ApiResponse({ status: 404, description: '즐겨찾기 없음' })
  remove(
    @Request() req: { user: { id: string } },
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.bookmarkService.remove(req.user.id, restaurantId);
  }

  @Get(':restaurantId/check')
  @ApiOperation({ summary: '즐겨찾기 여부 확인' })
  @ApiParam({ name: 'restaurantId', description: '음식점 ID' })
  @ApiResponse({ status: 200, description: '{ isBookmarked: boolean }' })
  check(
    @Request() req: { user: { id: string } },
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.bookmarkService.check(req.user.id, restaurantId);
  }
}
