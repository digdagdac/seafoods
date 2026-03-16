import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RestaurantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ListRestaurantsQuery {
  q?: string;
  region?: string;
  category?: string;
  hasSanction?: boolean;
  status?: RestaurantStatus;
  cursor?: string;
  limit?: number;
}

export interface NearbyQuery {
  lat: number;
  lng: number;
  radius?: number;
  hasSanction?: boolean;
  cursor?: string;
  limit?: number;
}

interface NearbyCursorPayload {
  id: string;
  distanceMeters: number;
}

function encodeNearbyCursor(payload: NearbyCursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeNearbyCursor(cursor?: string): NearbyCursorPayload | null {
  if (!cursor) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as NearbyCursorPayload;
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.id !== 'string' ||
      typeof payload.distanceMeters !== 'number'
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ListRestaurantsQuery) {
    const limit = Math.min(query.limit ?? 20, 100);

    const where: Prisma.RestaurantWhereInput = {};

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { normalizedName: { contains: query.q, mode: 'insensitive' } },
        { roadAddress: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.region) {
      where.regionCode = { startsWith: query.region };
    }

    if (query.category) {
      where.category = { contains: query.category, mode: 'insensitive' };
    }

    if (query.hasSanction === true) {
      where.totalSanctions = { gt: 0 };
    } else if (query.hasSanction === false) {
      where.totalSanctions = 0;
    }

    if (query.status) {
      where.status = query.status;
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ totalSanctions: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        name: true,
        normalizedName: true,
        category: true,
        subcategory: true,
        roadAddress: true,
        jibunAddress: true,
        latitude: true,
        longitude: true,
        regionCode: true,
        status: true,
        totalSanctions: true,
        lastSanctionAt: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = restaurants.length > limit;
    const items = hasMore ? restaurants.slice(0, limit) : restaurants;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return {
      items,
      cursor: nextCursor,
      hasMore,
    };
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        sanctions: {
          orderBy: { dispositionDate: 'desc' },
          take: 5,
          select: {
            id: true,
            sanctionType: true,
            severity: true,
            violationContent: true,
            dispositionContent: true,
            dispositionDate: true,
            legalBasis: true,
            source: true,
            isVerified: true,
          },
        },
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`음식점을 찾을 수 없습니다: ${id}`);
    }

    return restaurant;
  }

  async findSanctions(id: string, cursor?: string, limit = 20) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`음식점을 찾을 수 없습니다: ${id}`);
    }

    const take = Math.min(limit, 100);

    const sanctions = await this.prisma.sanction.findMany({
      where: { restaurantId: id },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
      },
    });

    const hasMore = sanctions.length > take;
    const items = hasMore ? sanctions.slice(0, take) : sanctions;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return { items, cursor: nextCursor, hasMore };
  }

  async findNearby(query: NearbyQuery) {
    const { lat, lng, radius = 1000, hasSanction, limit = 20 } = query;
    const take = Math.min(limit, 100);
    const decodedCursor = decodeNearbyCursor(query.cursor);

    const sanctionClause =
      hasSanction === true
        ? Prisma.sql`AND r.total_sanctions > 0`
        : hasSanction === false
          ? Prisma.sql`AND r.total_sanctions = 0`
          : Prisma.empty;

    const cursorClause = decodedCursor
      ? Prisma.sql`
          WHERE (
            base.distance_meters > ${decodedCursor.distanceMeters}
            OR (
              base.distance_meters = ${decodedCursor.distanceMeters}
              AND base.id > ${decodedCursor.id}
            )
          )
        `
      : Prisma.empty;

    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        normalized_name: string;
        category: string;
        road_address: string | null;
        latitude: number | null;
        longitude: number | null;
        region_code: string;
        status: string;
        total_sanctions: number;
        last_sanction_at: Date | null;
        distance_meters: number;
      }>
    >(
      Prisma.sql`
        WITH base AS (
          SELECT
            r.id,
            r.name,
            r.normalized_name,
            r.category,
            r.road_address,
            r.latitude,
            r.longitude,
            r.region_code,
            r.status,
            r.total_sanctions,
            r.last_sanction_at,
            ST_Distance(
              ST_MakePoint(r.longitude, r.latitude)::geography,
              ST_MakePoint(${lng}, ${lat})::geography
            ) AS distance_meters
          FROM restaurants r
          WHERE
            r.latitude IS NOT NULL
            AND r.longitude IS NOT NULL
            AND ST_DWithin(
              ST_MakePoint(r.longitude, r.latitude)::geography,
              ST_MakePoint(${lng}, ${lat})::geography,
              ${radius}
            )
            ${sanctionClause}
        )
        SELECT
          base.id,
          base.name,
          base.normalized_name,
          base.category,
          base.road_address,
          base.latitude,
          base.longitude,
          base.region_code,
          base.status,
          base.total_sanctions,
          base.last_sanction_at,
          base.distance_meters
        FROM base
        ${cursorClause}
        ORDER BY base.distance_meters ASC, base.id ASC
        LIMIT ${take + 1}
      `,
    );

    const hasMore = results.length > take;
    const items = hasMore ? results.slice(0, take) : results;

    const nextCursor = hasMore
      ? encodeNearbyCursor({
          id: items[items.length - 1].id,
          distanceMeters: Number(items[items.length - 1].distance_meters),
        })
      : undefined;

    return {
      items: items.map((r) => ({
        id: r.id,
        name: r.name,
        normalizedName: r.normalized_name,
        category: r.category,
        roadAddress: r.road_address,
        latitude: r.latitude,
        longitude: r.longitude,
        regionCode: r.region_code,
        status: r.status,
        totalSanctions: r.total_sanctions,
        lastSanctionAt: r.last_sanction_at,
        distanceMeters: Math.round(Number(r.distance_meters)),
      })),
      cursor: nextCursor,
      hasMore,
    };
  }
}
