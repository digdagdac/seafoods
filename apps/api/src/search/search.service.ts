import { Injectable } from '@nestjs/common';
import { Prisma, SanctionSeverity, SanctionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchSortBy } from './dto/search-query.dto';

export interface UnifiedSearchQuery {
  q: string;
  sido?: string;
  sigungu?: string;
  region?: string;
  category?: string;
  sanctionType?: SanctionType;
  dateFrom?: Date;
  dateTo?: Date;
  severity?: SanctionSeverity;
  hasSanction?: boolean;
  sortBy?: SearchSortBy;
  cursor?: string;
  limit?: number;
}

interface SearchCursorPayload {
  sortBy: SearchSortBy;
  id: string;
  relevanceScore?: number;
  sanctionCount?: number;
  lastDispositionDate?: string | null;
  severityRank?: number;
}

function encodeCursor(payload: SearchCursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(cursor?: string): SearchCursorPayload | null {
  if (!cursor) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as SearchCursorPayload;
    if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

const severityRankSql = Prisma.sql`
  CASE s.severity
    WHEN 'CRITICAL' THEN 4
    WHEN 'HIGH' THEN 3
    WHEN 'MEDIUM' THEN 2
    WHEN 'LOW' THEN 1
    ELSE 0
  END
`;

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: UnifiedSearchQuery) {
    const {
      q,
      sido,
      sigungu,
      region,
      category,
      sanctionType,
      dateFrom,
      dateTo,
      severity,
      hasSanction,
      sortBy = 'relevance',
      cursor,
      limit = 20,
    } = query;

    if (!q || q.trim().length === 0) {
      return { items: [], cursor: undefined, hasMore: false };
    }

    const take = Math.min(limit, 100);
    const sanitized = q.trim();
    const regionPrefix = sigungu ?? sido ?? region;
    const decodedCursor = decodeCursor(cursor);

    const textSimilarity = Prisma.sql`
      GREATEST(
        similarity(r.name, ${sanitized}),
        similarity(r.normalized_name, ${sanitized}),
        similarity(COALESCE(r.road_address, ''), ${sanitized}),
        similarity(COALESCE(r.jibun_address, ''), ${sanitized})
      )
    `;

    const sanctionFilters: Prisma.Sql[] = [];

    if (sanctionType) {
      sanctionFilters.push(Prisma.sql`AND s.sanction_type = ${sanctionType}`);
    }

    if (severity) {
      sanctionFilters.push(Prisma.sql`AND s.severity = ${severity}`);
    }

    if (dateFrom) {
      sanctionFilters.push(Prisma.sql`AND s.disposition_date >= ${dateFrom}`);
    }

    if (dateTo) {
      sanctionFilters.push(Prisma.sql`AND s.disposition_date <= ${dateTo}`);
    }

    const sanctionFilterClause = sanctionFilters.length
      ? Prisma.sql`${Prisma.join(sanctionFilters, Prisma.sql` `)}`
      : Prisma.empty;

    const regionClause = regionPrefix
      ? Prisma.sql`AND r.region_code LIKE ${regionPrefix + '%'}`
      : Prisma.empty;

    const categoryClause = category
      ? Prisma.sql`AND r.category ILIKE ${'%' + category.trim() + '%'}`
      : Prisma.empty;

    const hasSanctionFromFilters = Boolean(sanctionType || severity || dateFrom || dateTo);
    const sanctionPresenceClause =
      hasSanction === true || hasSanctionFromFilters
        ? Prisma.sql`AND sanction_stats.sanction_count > 0`
        : hasSanction === false
          ? Prisma.sql`AND sanction_stats.sanction_count = 0`
          : Prisma.empty;

    let orderByClause: Prisma.Sql = Prisma.sql`${textSimilarity} DESC, sanction_stats.sanction_count DESC, r.id ASC`;
    let cursorClause: Prisma.Sql = Prisma.empty;

    if (sortBy === 'date_desc') {
      orderByClause = Prisma.sql`sanction_stats.last_disposition_date DESC NULLS LAST, r.id ASC`;

      if (decodedCursor && decodedCursor.sortBy === sortBy) {
        const cursorDate = decodedCursor.lastDispositionDate ? new Date(decodedCursor.lastDispositionDate) : null;
        cursorClause = cursorDate
          ? Prisma.sql`
              AND (
                COALESCE(sanction_stats.last_disposition_date, to_timestamp(0)) < ${cursorDate}
                OR (
                  COALESCE(sanction_stats.last_disposition_date, to_timestamp(0)) = ${cursorDate}
                  AND r.id > ${decodedCursor.id}
                )
              )
            `
          : Prisma.sql`AND sanction_stats.last_disposition_date IS NULL AND r.id > ${decodedCursor.id}`;
      }
    } else if (sortBy === 'date_asc') {
      orderByClause = Prisma.sql`sanction_stats.last_disposition_date ASC NULLS LAST, r.id ASC`;

      if (decodedCursor && decodedCursor.sortBy === sortBy) {
        const cursorDate = decodedCursor.lastDispositionDate ? new Date(decodedCursor.lastDispositionDate) : null;
        cursorClause = cursorDate
          ? Prisma.sql`
              AND (
                COALESCE(sanction_stats.last_disposition_date, TIMESTAMP '9999-12-31') > ${cursorDate}
                OR (
                  COALESCE(sanction_stats.last_disposition_date, TIMESTAMP '9999-12-31') = ${cursorDate}
                  AND r.id > ${decodedCursor.id}
                )
              )
            `
          : Prisma.sql`AND sanction_stats.last_disposition_date IS NULL AND r.id > ${decodedCursor.id}`;
      }
    } else if (sortBy === 'severity') {
      orderByClause = Prisma.sql`
        sanction_stats.max_severity_rank DESC,
        sanction_stats.last_disposition_date DESC NULLS LAST,
        r.id ASC
      `;

      if (decodedCursor && decodedCursor.sortBy === sortBy) {
        const cursorSeverity = decodedCursor.severityRank ?? 0;
        const cursorDate = decodedCursor.lastDispositionDate ? new Date(decodedCursor.lastDispositionDate) : new Date(0);
        cursorClause = Prisma.sql`
          AND (
            sanction_stats.max_severity_rank < ${cursorSeverity}
            OR (
              sanction_stats.max_severity_rank = ${cursorSeverity}
              AND COALESCE(sanction_stats.last_disposition_date, to_timestamp(0)) < ${cursorDate}
            )
            OR (
              sanction_stats.max_severity_rank = ${cursorSeverity}
              AND COALESCE(sanction_stats.last_disposition_date, to_timestamp(0)) = ${cursorDate}
              AND r.id > ${decodedCursor.id}
            )
          )
        `;
      }
    } else {
      if (decodedCursor && decodedCursor.sortBy === sortBy) {
        const cursorScore = decodedCursor.relevanceScore ?? 0;
        const cursorSanctionCount = decodedCursor.sanctionCount ?? 0;
        cursorClause = Prisma.sql`
          AND (
            ${textSimilarity} < ${cursorScore}
            OR (${textSimilarity} = ${cursorScore} AND sanction_stats.sanction_count < ${cursorSanctionCount})
            OR (
              ${textSimilarity} = ${cursorScore}
              AND sanction_stats.sanction_count = ${cursorSanctionCount}
              AND r.id > ${decodedCursor.id}
            )
          )
        `;
      }
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        normalized_name: string;
        category: string;
        subcategory: string | null;
        road_address: string | null;
        jibun_address: string | null;
        latitude: number | null;
        longitude: number | null;
        region_code: string;
        status: string;
        total_sanctions: number;
        last_sanction_at: Date | null;
        relevance_score: number;
        sanction_count: number;
        last_disposition_date: Date | null;
        max_severity_rank: number;
        sanction_history: Array<{
          id: string;
          sanctionType: SanctionType;
          severity: SanctionSeverity;
          dispositionDate: string;
          violationContent: string;
          dispositionContent: string;
        }>;
      }>
    >(
      Prisma.sql`
        SELECT
          r.id,
          r.name,
          r.normalized_name,
          r.category,
          r.subcategory,
          r.road_address,
          r.jibun_address,
          r.latitude,
          r.longitude,
          r.region_code,
          r.status,
          r.total_sanctions,
          r.last_sanction_at,
          ${textSimilarity} AS relevance_score,
          sanction_stats.sanction_count,
          sanction_stats.last_disposition_date,
          sanction_stats.max_severity_rank,
          sanction_stats.sanction_history
        FROM restaurants r
        LEFT JOIN LATERAL (
          SELECT
            stat.sanction_count,
            stat.last_disposition_date,
            stat.max_severity_rank,
            COALESCE(hist.sanction_history, '[]'::json) AS sanction_history
          FROM (
            SELECT
              COUNT(*)::int AS sanction_count,
              MAX(s.disposition_date) AS last_disposition_date,
              COALESCE(MAX(${severityRankSql}), 0)::int AS max_severity_rank
            FROM sanctions s
            WHERE s.restaurant_id = r.id
            ${sanctionFilterClause}
          ) stat
          LEFT JOIN LATERAL (
            SELECT
              json_agg(
                json_build_object(
                  'id', s.id,
                  'sanctionType', s.sanction_type,
                  'severity', s.severity,
                  'dispositionDate', s.disposition_date,
                  'violationContent', s.violation_content,
                  'dispositionContent', s.disposition_content
                )
                ORDER BY s.disposition_date DESC
              ) AS sanction_history
            FROM (
              SELECT
                s.id,
                s.sanction_type,
                s.severity,
                s.disposition_date,
                s.violation_content,
                s.disposition_content
              FROM sanctions s
              WHERE s.restaurant_id = r.id
              ${sanctionFilterClause}
              ORDER BY s.disposition_date DESC
              LIMIT 5
            ) s
          ) hist ON TRUE
        ) sanction_stats ON TRUE
        WHERE (
          r.name ILIKE ${'%' + sanitized + '%'}
          OR r.normalized_name ILIKE ${'%' + sanitized + '%'}
          OR COALESCE(r.road_address, '') ILIKE ${'%' + sanitized + '%'}
          OR COALESCE(r.jibun_address, '') ILIKE ${'%' + sanitized + '%'}
          OR ${textSimilarity} >= 0.15
        )
        ${regionClause}
        ${categoryClause}
        ${sanctionPresenceClause}
        ${cursorClause}
        ORDER BY ${orderByClause}
        LIMIT ${take + 1}
      `,
    );

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;

    const nextCursor = hasMore
      ? (() => {
          const last = items[items.length - 1];
          if (sortBy === 'date_desc' || sortBy === 'date_asc') {
            return encodeCursor({
              sortBy,
              id: last.id,
              lastDispositionDate: last.last_disposition_date?.toISOString() ?? null,
            });
          }

          if (sortBy === 'severity') {
            return encodeCursor({
              sortBy,
              id: last.id,
              severityRank: last.max_severity_rank,
              lastDispositionDate: last.last_disposition_date?.toISOString() ?? null,
            });
          }

          return encodeCursor({
            sortBy,
            id: last.id,
            relevanceScore: Number(last.relevance_score),
            sanctionCount: last.sanction_count,
          });
        })()
      : undefined;

    return {
      items: items.map((row) => ({
        id: row.id,
        name: row.name,
        normalizedName: row.normalized_name,
        category: row.category,
        subcategory: row.subcategory,
        roadAddress: row.road_address,
        jibunAddress: row.jibun_address,
        latitude: row.latitude,
        longitude: row.longitude,
        regionCode: row.region_code,
        status: row.status,
        totalSanctions: row.total_sanctions,
        lastSanctionAt: row.last_sanction_at,
        relevance: Number(Number(row.relevance_score).toFixed(4)),
        sanctionCount: row.sanction_count,
        lastDispositionDate: row.last_disposition_date,
        maxSeverityRank: row.max_severity_rank,
        sanctionHistory: row.sanction_history ?? [],
      })),
      cursor: nextCursor,
      hasMore,
      query: sanitized,
      sortBy,
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
          GREATEST(
            similarity(r.name, ${sanitized}),
            similarity(r.normalized_name, ${sanitized})
          ) AS similarity
        FROM restaurants r
        WHERE
          r.normalized_name ILIKE ${'%' + sanitized + '%'}
          OR r.name ILIKE ${'%' + sanitized + '%'}
          OR similarity(r.normalized_name, ${sanitized}) >= 0.15
          OR similarity(r.name, ${sanitized}) >= 0.15
        ORDER BY similarity DESC, r.total_sanctions DESC, r.id ASC
        LIMIT ${take}
      `,
    );

    return {
      items: results.map((item) => ({
        ...item,
        similarity: Number(Number(item.similarity).toFixed(4)),
      })),
    };
  }
}
