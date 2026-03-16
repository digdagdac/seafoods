import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, cursor?: string, limit = 20) {
    const take = Math.min(limit, 100);

    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            category: true,
            roadAddress: true,
            regionCode: true,
            status: true,
            totalSanctions: true,
            lastSanctionAt: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const hasMore = bookmarks.length > take;
    const items = hasMore ? bookmarks.slice(0, take) : bookmarks;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return { items, cursor: nextCursor, hasMore };
  }

  async create(userId: string, restaurantId: string) {
    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`음식점을 찾을 수 없습니다: ${restaurantId}`);
    }

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_restaurantId: { userId, restaurantId } },
    });

    if (existing) {
      throw new ConflictException('이미 즐겨찾기에 추가된 음식점입니다');
    }

    const bookmark = await this.prisma.bookmark.create({
      data: { userId, restaurantId },
      select: {
        id: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            category: true,
            roadAddress: true,
            regionCode: true,
            status: true,
            totalSanctions: true,
          },
        },
      },
    });

    return bookmark;
  }

  async remove(userId: string, restaurantId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_restaurantId: { userId, restaurantId } },
    });

    if (!bookmark) {
      throw new NotFoundException('즐겨찾기를 찾을 수 없습니다');
    }

    await this.prisma.bookmark.delete({
      where: { userId_restaurantId: { userId, restaurantId } },
    });

    return { success: true };
  }

  async check(userId: string, restaurantId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_restaurantId: { userId, restaurantId } },
      select: { id: true },
    });

    return { isBookmarked: !!bookmark };
  }
}
