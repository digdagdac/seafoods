import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface UnifiedSearchQuery {
  q: string;
  region?: string;
  category?: string;
  hasSanction?: boolean;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Prioritize pg_trgm similarity for ranking.
   * Fallback to ILIKE matches when similarity score is low.
   */
  async search(query: UnifiedSearchQuery) {
    const { q, region, category, hasSanction, cursor, limit = 20 } = query;
    const take = Math.min(limit, 100);

    if (!q || q.trim().length === 0) {
      return { items: [], cursor: undefined, hasMore: false };
    }

    const sanitized = q.trim();

    const regionClause = region
      ? Prisma.sql`AND r.region_code LIKE ${region + '%'} `
      : Prisma.empty;

    const categoryClause = category
      ? Prisma.sql`AND r.category ILIKE ${'%' + category + '%'} `
      : Prisma.empty;

    const sanctionClause =
      hasSanction === true
        ? Prisma.sql`AND r.total_sanctions > 0 `
        : hasSanction === false
          ? Prisma.sql`AND r.total_sanctions = 0 `
          : Prisma.empty;

    const cursorClause = cursor
      ? Prisma.sql`AND r.id > ${cursor} `
      : Prisma.empty;

    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        normalized_name: string;
        category: string;
        road_address: string | null;
        jibun_address: string | null;
        latitude: number | null;
        longitude: number | null;
        region_code: string;
        status: string;
        total_sanctions: number;
        last_sanction_at: Date | null;
        similarity: number;
      }>
    >(
      Prisma.sql`
        SELECT
          r.id,
          r.name,
          r.normalized_name,
          r.category,
          r.road_address,
          r.jibun_address,
          r.latitude,
          r.longitude,
          r.region_code,
          r.status,
          r.total_sanctions,
          r.last_sanction_at,
          GREATEST(
            similarity(r.name, ${sanitized}),
            similarity(r.normalized_name, ${sanitized})
          ) AS similarity
        FROM restaurants r
        WHERE (
          similarity(r.name, ${sanitized}) > 0.25
          OR similarity(r.normalized_name, ${sanitized}) > 0.25
          OR (
            similarity(r.name, ${sanitized}) <= 0.25
            AND similarity(r.normalized_name, ${sanitized}) <= 0.25
            AND (
              r.name ILIKE ${'%' + sanitized + '%'}
              OR r.normalized_name ILIKE ${'%' + sanitized + '%'}
              OR r.road_address ILIKE ${'%' + sanitized + '%'}
            )
          )
        )
        ${regionClause}
        ${categoryClause}
        ${sanctionClause}
        ${cursorClause}
        ORDER BY similarity DESC, r.total_sanctions DESC
        LIMIT ${take + 1}
      `,
    );

    const hasMore = results.length > take;
    const items = hasMore ? results.slice(0, take) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return {
      items: items.map((r) => ({
        id: r.id,
        name: r.name,
        normalizedName: r.normalized_name,
        category: r.category,
        roadAddress: r.road_address,
        jibunAddress: r.jibun_address,
        latitude: r.latitude,
        longitude: r.longitude,
        regionCode: r.region_code,
        status: r.status,
        totalSanctions: r.total_sanctions,
        lastSanctionAt: r.last_sanction_at,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
      cursor: nextCursor,
      hasMore,
      query: sanitized,
    };
  }

  async suggestions(q: string, limit = 5) {
    if (!q || q.trim().length < 2) {
      return { items: [] };
    }

    const sanitized = q.trim();
    const take = Math.min(limit, 10);

    const results = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; category: string; similarity: number }>
    >(
      Prisma.sql`
        SELECT
          r.id,
          r.name,
          r.category,
          similarity(r.normalized_name, ${sanitized}) AS similarity
        FROM restaurants r
        WHERE
          similarity(r.normalized_name, ${sanitized}) > 0.25
          OR (
            similarity(r.normalized_name, ${sanitized}) <= 0.25
            AND r.normalized_name ILIKE ${'%' + sanitized + '%'}
          )
        ORDER BY similarity DESC, r.total_sanctions DESC
        LIMIT ${take}
      `,
    );

    return { items: results };
  }
}
