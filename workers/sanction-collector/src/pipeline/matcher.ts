import { Prisma, PrismaClient, RawSanction } from '@prisma/client';
import { normalizeAddress, normalizeRestaurantName } from '@safedeliver/utils';

export interface MatchResult {
  restaurantId: string | null;
  confidence: number;
}

const MATCH_THRESHOLD = 0.7;
const MAX_CANDIDATES = 30;

interface Candidate {
  id: string;
  similarity: number;
}

export class RestaurantMatcher {
  constructor(private readonly prisma: PrismaClient) {}

  async match(raw: RawSanction): Promise<MatchResult> {
    if (!raw.rawBusinessName) {
      return { restaurantId: null, confidence: 0 };
    }

    const normalizedName = normalizeRestaurantName(raw.rawBusinessName).normalized;
    if (!normalizedName) {
      return { restaurantId: null, confidence: 0 };
    }

    const normalizedAddress = raw.rawAddress ? normalizeAddress(raw.rawAddress) : null;

    const trigramCandidates = await this.findByTrigram(normalizedName, normalizedAddress);
    if (trigramCandidates.length > 0) {
      const best = trigramCandidates[0];
      if (best.similarity >= MATCH_THRESHOLD) {
        return { restaurantId: best.id, confidence: round(best.similarity) };
      }
    }

    const fallback = await this.findByIlike(normalizedName, normalizedAddress);
    if (!fallback) {
      return { restaurantId: null, confidence: 0 };
    }

    return {
      restaurantId: fallback.id,
      confidence: round(Math.max(fallback.similarity, 0.55)),
    };
  }

  private async findByTrigram(
    normalizedName: string,
    normalizedAddress: string | null,
  ): Promise<Candidate[]> {
    const rows = await this.prisma.$queryRaw<Candidate[]>(Prisma.sql`
      SELECT
        r.id,
        GREATEST(
          similarity(lower(COALESCE(r.normalized_name, r.name)), lower(${normalizedName})),
          similarity(lower(r.name), lower(${normalizedName}))
        )::float AS similarity
      FROM restaurants r
      WHERE (
        similarity(lower(COALESCE(r.normalized_name, r.name)), lower(${normalizedName})) > 0.25
        OR similarity(lower(r.name), lower(${normalizedName})) > 0.25
      )
      ${
        normalizedAddress
          ? Prisma.sql`AND (
              r.road_address ILIKE ${`%${normalizedAddress}%`}
              OR r.jibun_address ILIKE ${`%${normalizedAddress}%`}
            )`
          : Prisma.empty
      }
      ORDER BY similarity DESC
      LIMIT ${MAX_CANDIDATES}
    `);

    return rows;
  }

  private async findByIlike(
    normalizedName: string,
    normalizedAddress: string | null,
  ): Promise<Candidate | null> {
    const headToken = normalizedName.split(' ').find(Boolean) ?? normalizedName;

    const candidates = await this.prisma.restaurant.findMany({
      where: {
        OR: [
          { normalizedName: { contains: headToken, mode: 'insensitive' } },
          { name: { contains: headToken, mode: 'insensitive' } },
        ],
      },
      take: MAX_CANDIDATES,
      select: {
        id: true,
        name: true,
        normalizedName: true,
        roadAddress: true,
        jibunAddress: true,
      },
    });

    let best: Candidate | null = null;
    for (const candidate of candidates) {
      const nameScore = computeTextSimilarity(
        normalizedName,
        candidate.normalizedName || candidate.name,
      );

      const addressScore = normalizedAddress
        ? computeAddressSimilarity(
            normalizedAddress,
            candidate.roadAddress || candidate.jibunAddress,
          )
        : 0;

      const score = nameScore * 0.8 + addressScore * 0.2;
      if (!best || score > best.similarity) {
        best = { id: candidate.id, similarity: score };
      }
    }

    return best;
  }
}

export function computeTextSimilarity(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  if (!left || !right) {
    return 0;
  }

  const a = normalizeRestaurantName(left).normalized.toLowerCase();
  const b = normalizeRestaurantName(right).normalized.toLowerCase();

  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      intersection += 1;
    }
  }

  const denominator = Math.max(aTokens.size, bTokens.size);
  return denominator > 0 ? round(intersection / denominator) : 0;
}

export function scoreCandidate(
  raw: { name: string | null; address: string | null },
  candidate: { name: string | null; address: string | null },
): number {
  const nameScore = computeTextSimilarity(raw.name, candidate.name);
  const addressScore = computeAddressSimilarity(raw.address, candidate.address);
  return round(nameScore * 0.75 + addressScore * 0.25);
}

function computeAddressSimilarity(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  if (!left || !right) {
    return 0;
  }

  const a = normalizeAddress(left).toLowerCase();
  const b = normalizeAddress(right).toLowerCase();

  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  if (a.includes(b) || b.includes(a)) {
    return 0.85;
  }

  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));
  const union = new Set([...aTokens, ...bTokens]).size;
  if (union === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      intersection += 1;
    }
  }

  return round(intersection / union);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
