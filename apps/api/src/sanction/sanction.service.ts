import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SanctionType, SanctionSeverity } from '@prisma/client';

export interface ListSanctionsQuery {
  restaurantId?: string;
  sanctionType?: SanctionType;
  severity?: SanctionSeverity;
  region?: string;
  fromDate?: Date;
  toDate?: Date;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class SanctionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ListSanctionsQuery) {
    const limit = Math.min(query.limit ?? 20, 100);

    const where: Prisma.SanctionWhereInput = {};

    if (query.restaurantId) {
      where.restaurantId = query.restaurantId;
    }

    if (query.sanctionType) {
      where.sanctionType = query.sanctionType;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.region) {
      where.restaurant = { regionCode: { startsWith: query.region } };
    }

    if (query.fromDate || query.toDate) {
      where.dispositionDate = {};
      if (query.fromDate) where.dispositionDate.gte = query.fromDate;
      if (query.toDate) where.dispositionDate.lte = query.toDate;
    }

    const sanctions = await this.prisma.sanction.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { dispositionDate: 'desc' },
      select: {
        id: true,
        restaurantId: true,
        sanctionType: true,
        severity: true,
        violationContent: true,
        dispositionContent: true,
        dispositionDate: true,
        legalBasis: true,
        source: true,
        isVerified: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            category: true,
            roadAddress: true,
            regionCode: true,
          },
        },
      },
    });

    const hasMore = sanctions.length > limit;
    const items = hasMore ? sanctions.slice(0, limit) : sanctions;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return { items, cursor: nextCursor, hasMore };
  }

  async findRecent(limit = 20) {
    const take = Math.min(limit, 50);

    const sanctions = await this.prisma.sanction.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        restaurantId: true,
        sanctionType: true,
        severity: true,
        violationContent: true,
        dispositionContent: true,
        dispositionDate: true,
        createdAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            category: true,
            roadAddress: true,
            regionCode: true,
          },
        },
      },
    });

    return { items: sanctions };
  }

  async getStats() {
    const [
      totalSanctions,
      bySeverity,
      byType,
      recentMonthCount,
      verifiedCount,
    ] = await Promise.all([
      this.prisma.sanction.count(),
      this.prisma.sanction.groupBy({
        by: ['severity'],
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.sanction.groupBy({
        by: ['sanctionType'],
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.sanction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.sanction.count({ where: { isVerified: true } }),
    ]);

    return {
      total: totalSanctions,
      recentMonth: recentMonthCount,
      verified: verifiedCount,
      bySeverity: bySeverity.map((s) => ({
        severity: s.severity,
        count: s._count._all,
      })),
      byType: byType.map((t) => ({
        type: t.sanctionType,
        count: t._count._all,
      })),
    };
  }

  async findOne(id: string) {
    const sanction = await this.prisma.sanction.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            normalizedName: true,
            category: true,
            roadAddress: true,
            jibunAddress: true,
            latitude: true,
            longitude: true,
            regionCode: true,
            status: true,
            totalSanctions: true,
          },
        },
      },
    });

    if (!sanction) {
      throw new NotFoundException(`행정처분 정보를 찾을 수 없습니다: ${id}`);
    }

    return sanction;
  }
}
