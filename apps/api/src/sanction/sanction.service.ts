import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SanctionSeverity, SanctionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
    const [totalCount, typeRows, severityRows, byMonth, byRegion] = await Promise.all([
      this.prisma.sanction.count(),
      this.prisma.sanction.groupBy({
        by: ['sanctionType'],
        _count: { _all: true },
      }),
      this.prisma.sanction.groupBy({
        by: ['severity'],
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<Array<{ month: string; count: number }>>(Prisma.sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', s.disposition_date), 'YYYY-MM') AS month,
          COUNT(*)::int AS count
        FROM sanctions s
        GROUP BY 1
        ORDER BY 1 DESC
      `),
      this.prisma.$queryRaw<Array<{ regionCode: string; count: number }>>(Prisma.sql`
        SELECT
          r.region_code AS "regionCode",
          COUNT(*)::int AS count
        FROM sanctions s
        INNER JOIN restaurants r ON r.id = s.restaurant_id
        GROUP BY r.region_code
        ORDER BY count DESC, r.region_code ASC
      `),
    ]);

    const byTypeRecord = Object.values(SanctionType).reduce<Record<string, number>>(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {},
    );

    for (const row of typeRows) {
      byTypeRecord[row.sanctionType] = row._count._all;
    }

    const bySeverityRecord = Object.values(SanctionSeverity).reduce<Record<string, number>>(
      (acc, severity) => {
        acc[severity] = 0;
        return acc;
      },
      {},
    );

    for (const row of severityRows) {
      bySeverityRecord[row.severity] = row._count._all;
    }

    return {
      totalCount,
      byType: byTypeRecord,
      bySeverity: bySeverityRecord,
      byMonth,
      byRegion: byRegion.map((row) => ({
        regionCode: row.regionCode,
        regionName: row.regionCode,
        count: row.count,
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
